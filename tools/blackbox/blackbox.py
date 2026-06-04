#!/usr/bin/env python3
"""
Blackbox — Agentic OS Coding Intelligence Terminal
A Claude-powered coding assistant that lives in your terminal.
Optimized for code generation, debugging, refactoring, and review.

Usage:
  blackbox "write a REST API in FastAPI"
  blackbox --review myfile.py
  blackbox --fix error.log
  blackbox --debug "IndexError on line 42"
  blackbox --refactor src/module.py
  blackbox --explain src/complex.py
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import textwrap
from pathlib import Path
from typing import Optional

try:
    import anthropic
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "anthropic", "-q"])
    import anthropic

VERSION = "1.0.0"
DEFAULT_MODEL = os.getenv("BLACKBOX_MODEL", "claude-sonnet-4-6")
MAX_TOKENS = int(os.getenv("BLACKBOX_MAX_TOKENS", "16384"))
CONFIG_DIR = Path(os.getenv("CLAUDE_CONFIG_DIR", Path.home() / ".claude"))

BLACKBOX_SYSTEM = """You are Blackbox — the Agentic OS coding intelligence engine.
You are a senior software engineer with expertise in every language and framework.

Rules:
1. Always produce complete, working, production-quality code
2. Include file paths as headers (e.g., `# src/app.py`)
3. Explain non-obvious decisions in brief inline comments only
4. Never truncate code — always produce the full implementation
5. When reviewing code, categorize findings: CRITICAL / WARNING / INFO
6. When debugging, state the root cause first, then the fix
7. When refactoring, preserve exact behavior unless told otherwise
8. Use modern idiomatic patterns for the detected language
9. Add type annotations where the language supports them
10. Output only what was asked — no filler, no preamble

You know: Python, JavaScript/TypeScript, Rust, Go, Java, C/C++, Ruby, PHP,
Swift, Kotlin, Dart, Elixir, Haskell, SQL, Bash, PowerShell, YAML, JSON,
Dockerfile, Terraform, Kubernetes manifests, and more.

Agentic OS context:
- Python projects: use `uv` as package manager
- JS projects: prefer Bun over Node
- Default formatter: ruff (Python), biome (JS/TS)
- Testing: pytest (Python), vitest (JS/TS)"""

LANGUAGE_HINTS = {
    ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
    ".rs": "Rust", ".go": "Go", ".java": "Java",
    ".c": "C", ".cpp": "C++", ".h": "C/C++ header",
    ".rb": "Ruby", ".php": "PHP", ".swift": "Swift",
    ".kt": "Kotlin", ".dart": "Dart", ".ex": "Elixir",
    ".hs": "Haskell", ".sh": "Bash", ".ps1": "PowerShell",
    ".sql": "SQL", ".yaml": "YAML", ".yml": "YAML",
    ".json": "JSON", ".toml": "TOML",
    "Dockerfile": "Dockerfile", "Makefile": "Makefile",
}


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="blackbox",
        description="Blackbox — Agentic OS Coding Intelligence Terminal",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""
        Modes:
          (default)       Generate code from description
          --review/-r     Code review a file
          --fix/-x        Fix an error from a log or description
          --debug/-d      Debug a specific error
          --refactor/-R   Refactor a file for quality
          --explain/-e    Explain code in plain English
          --test/-t       Generate tests for a file
          --docs           Generate documentation
          --complete/-c   Complete/extend existing code

        Examples:
          blackbox "FastAPI REST API with SQLite, CRUD for users"
          blackbox --review src/app.py
          blackbox --fix error.log
          blackbox --debug "TypeError: 'NoneType' is not iterable in utils.py:42"
          blackbox --refactor lib/legacy.py
          blackbox --test src/calculator.py
          blackbox --explain src/parser.py --lang english
        """),
    )
    p.add_argument("prompt", nargs="?", help="Code generation prompt or context")
    p.add_argument("-r", "--review", metavar="FILE", help="Review a file")
    p.add_argument("-x", "--fix", metavar="FILE_OR_ERROR", help="Fix error from file or description")
    p.add_argument("-d", "--debug", metavar="ERROR", help="Debug an error")
    p.add_argument("-R", "--refactor", metavar="FILE", help="Refactor a file")
    p.add_argument("-e", "--explain", metavar="FILE", help="Explain a file")
    p.add_argument("-t", "--test", metavar="FILE", help="Generate tests for a file")
    p.add_argument("--docs", metavar="FILE", help="Generate documentation")
    p.add_argument("-c", "--complete", metavar="FILE", help="Complete/extend code")
    p.add_argument("--lang", default="auto", help="Target language (default: auto-detect)")
    p.add_argument("--model", default=DEFAULT_MODEL, help=f"Claude model (default: {DEFAULT_MODEL})")
    p.add_argument("--max-tokens", type=int, default=MAX_TOKENS)
    p.add_argument("--no-stream", action="store_true")
    p.add_argument("-i", "--interactive", action="store_true", help="Interactive coding REPL")
    p.add_argument("--context", metavar="FILE", help="Additional context file")
    p.add_argument("-v", "--version", action="version", version=f"Blackbox {VERSION}")
    return p


def get_api_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        key_file = CONFIG_DIR / "api_key"
        if key_file.exists():
            try:
                key = key_file.read_text().strip()
            except OSError as e:
                print(f"✗ Could not read {key_file}: {e}", file=sys.stderr)
                key = None
    if not key:
        print("✗ ANTHROPIC_API_KEY not set.", file=sys.stderr)
        print("  Export it: export ANTHROPIC_API_KEY='sk-ant-...'", file=sys.stderr)
        print("  Or store it: echo 'sk-ant-...' > ~/.claude/api_key", file=sys.stderr)
        sys.exit(1)
    return key


def read_file(path_str: str) -> tuple[str, str]:
    path = Path(path_str)
    if not path.exists():
        return path_str, "unknown"
    content = path.read_text(errors="replace")
    lang = LANGUAGE_HINTS.get(path.suffix, LANGUAGE_HINTS.get(path.name, "unknown"))
    return content, lang


def detect_language(file_path: Optional[str], prompt: Optional[str], lang_hint: str) -> str:
    if lang_hint != "auto":
        return lang_hint
    if file_path:
        p = Path(file_path)
        return LANGUAGE_HINTS.get(p.suffix, LANGUAGE_HINTS.get(p.name, ""))
    return ""


def stream_response(client: anthropic.Anthropic, model: str, max_tokens: int,
                    system: str, prompt: str, prefix: str = "") -> str:
    print(f"\033[90m[blackbox] {prefix}\033[0m", flush=True)
    full = ""
    with client.messages.stream(
        model=model, max_tokens=max_tokens,
        system=system, messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full += text
    print()
    return full


def mode_generate(client, args, lang: str) -> None:
    lang_str = f" ({lang})" if lang else ""
    stream_response(
        client, args.model, args.max_tokens, BLACKBOX_SYSTEM,
        args.prompt,
        prefix=f"generating{lang_str}",
    )


def mode_review(client, args) -> None:
    content, lang = read_file(args.review)
    prompt = f"Review this {lang} code for bugs, security issues, and improvements:\n\n```{lang.lower()}\n{content}\n```"
    stream_response(client, args.model, args.max_tokens, BLACKBOX_SYSTEM, prompt,
                    prefix=f"reviewing {args.review}")


def mode_fix(client, args) -> None:
    path = Path(args.fix)
    if path.exists():
        content, lang = read_file(args.fix)
        prompt = f"This is an error log or broken code. Fix it:\n\n```\n{content}\n```"
    else:
        prompt = f"Fix this error:\n\n{args.fix}"
    stream_response(client, args.model, args.max_tokens, BLACKBOX_SYSTEM, prompt,
                    prefix="fixing")


def mode_debug(client, args) -> None:
    prompt = f"Debug this error. State root cause first, then provide the exact fix:\n\n{args.debug}"
    if args.context:
        ctx_content, ctx_lang = read_file(args.context)
        prompt += f"\n\nContext code:\n```{ctx_lang.lower()}\n{ctx_content}\n```"
    stream_response(client, args.model, args.max_tokens, BLACKBOX_SYSTEM, prompt,
                    prefix="debugging")


def mode_refactor(client, args) -> None:
    content, lang = read_file(args.refactor)
    prompt = f"""Refactor this {lang} code for quality, readability, and performance.
Preserve exact behavior. Show the complete refactored file:

```{lang.lower()}
{content}
```"""
    stream_response(client, args.model, args.max_tokens, BLACKBOX_SYSTEM, prompt,
                    prefix=f"refactoring {args.refactor}")


def mode_explain(client, args) -> None:
    content, lang = read_file(args.explain)
    prompt = f"""Explain this {lang} code clearly. Cover:
1. What it does (1-2 sentences)
2. How it works (key mechanisms)
3. Non-obvious gotchas or design decisions

```{lang.lower()}
{content}
```"""
    stream_response(client, args.model, args.max_tokens, BLACKBOX_SYSTEM, prompt,
                    prefix=f"explaining {args.explain}")


def mode_test(client, args) -> None:
    content, lang = read_file(args.test)
    prompt = f"""Generate comprehensive tests for this {lang} code.
Use the idiomatic test framework for {lang}.
Include: happy paths, edge cases, error cases.
Show complete test file with imports:

```{lang.lower()}
{content}
```"""
    stream_response(client, args.model, args.max_tokens, BLACKBOX_SYSTEM, prompt,
                    prefix=f"generating tests for {args.test}")


def mode_docs(client, args) -> None:
    content, lang = read_file(args.docs)
    prompt = f"""Generate comprehensive documentation for this {lang} code.
Include: module overview, function/class docs, parameter descriptions, examples:

```{lang.lower()}
{content}
```"""
    stream_response(client, args.model, args.max_tokens, BLACKBOX_SYSTEM, prompt,
                    prefix=f"documenting {args.docs}")


def mode_complete(client, args) -> None:
    content, lang = read_file(args.complete)
    extra = f"\nUser instructions: {args.prompt}" if args.prompt else ""
    prompt = f"""Complete this {lang} code. Continue from where it left off.
Output the full completed file:{extra}

```{lang.lower()}
{content}
```"""
    stream_response(client, args.model, args.max_tokens, BLACKBOX_SYSTEM, prompt,
                    prefix=f"completing {args.complete}")


def interactive_repl(client: anthropic.Anthropic, args: argparse.Namespace) -> None:
    print(f"\033[1;35m┌─ Blackbox REPL ────────────────────────────────────────┐\033[0m")
    print(f"\033[1;35m│\033[0m  Model: {args.model:<48}\033[1;35m│\033[0m")
    print(f"\033[1;35m│\033[0m  Commands: :review <f>  :fix <f>  :test <f>  :exit    \033[1;35m│\033[0m")
    print(f"\033[1;35m└────────────────────────────────────────────────────────┘\033[0m")

    history: list[dict] = []

    while True:
        try:
            raw = input("\n\033[1;35mblackbox>\033[0m ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\033[90mGoodbye.\033[0m")
            break

        if not raw:
            continue
        if raw in (":exit", ":quit", "exit", "quit"):
            break

        # In-REPL commands
        if raw.startswith(":review "):
            content, lang = read_file(raw[8:].strip())
            prompt = f"Review this {lang} code:\n```{lang.lower()}\n{content}\n```"
        elif raw.startswith(":fix "):
            content, lang = read_file(raw[5:].strip())
            prompt = f"Fix this code:\n```{lang.lower()}\n{content}\n```"
        elif raw.startswith(":test "):
            content, lang = read_file(raw[6:].strip())
            prompt = f"Write tests for this {lang} code:\n```{lang.lower()}\n{content}\n```"
        elif raw.startswith(":explain "):
            content, lang = read_file(raw[9:].strip())
            prompt = f"Explain this {lang} code:\n```{lang.lower()}\n{content}\n```"
        else:
            prompt = raw

        history.append({"role": "user", "content": prompt})
        print(f"\033[90m[blackbox]\033[0m ", end="", flush=True)
        full = ""
        with client.messages.stream(
            model=args.model, max_tokens=args.max_tokens,
            system=BLACKBOX_SYSTEM, messages=history,
        ) as stream:
            for text in stream.text_stream:
                print(text, end="", flush=True)
                full += text
        print()
        history.append({"role": "assistant", "content": full})


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if not any([args.prompt, args.review, args.fix, args.debug, args.refactor,
                args.explain, args.test, args.docs, args.complete, args.interactive]):
        parser.print_help()
        sys.exit(0)

    client = anthropic.Anthropic(api_key=get_api_key())
    lang = detect_language(
        args.review or args.fix or args.refactor or args.explain or args.test or args.docs or args.complete,
        args.prompt,
        args.lang,
    )

    if args.interactive:
        interactive_repl(client, args)
    elif args.review:
        mode_review(client, args)
    elif args.fix:
        mode_fix(client, args)
    elif args.debug:
        mode_debug(client, args)
    elif args.refactor:
        mode_refactor(client, args)
    elif args.explain:
        mode_explain(client, args)
    elif args.test:
        mode_test(client, args)
    elif args.docs:
        mode_docs(client, args)
    elif args.complete:
        mode_complete(client, args)
    elif args.prompt:
        mode_generate(client, args, lang)


if __name__ == "__main__":
    main()
