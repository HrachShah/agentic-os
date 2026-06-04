#!/usr/bin/env python3
"""
Hermes — Agentic OS AI Task Delegation Terminal
Run `hermes "task"` to delegate work to the Hermes AI agent.
Hermes uses Claude Haiku for fast, cost-effective task execution.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import textwrap
from pathlib import Path
from typing import Optional

try:
    import anthropic
except ImportError:
    print("Installing anthropic SDK...", file=sys.stderr)
    subprocess.check_call([sys.executable, "-m", "pip", "install", "anthropic", "-q"])
    import anthropic

# ── Constants ─────────────────────────────────────────────────────────────────
VERSION = "1.0.0"
DEFAULT_MODEL = os.getenv("HERMES_MODEL", "claude-haiku-4-5-20251001")
MAX_TOKENS = int(os.getenv("HERMES_MAX_TOKENS", "8192"))
SKILLS_DIR = Path(os.getenv("CLAUDE_SKILLS_DIR", Path.home() / ".claude" / "skills"))
CONFIG_DIR = Path(os.getenv("CLAUDE_CONFIG_DIR", Path.home() / ".claude"))

HERMES_SYSTEM = """You are Hermes — the swift task-execution AI agent built into Agentic OS.
You are optimized for speed and precision. You:
- Execute tasks directly without asking unnecessary clarifying questions
- Write working code on the first try
- Provide concise, actionable output
- Use shell commands wrapped in ```bash blocks when execution is needed
- Never produce boilerplate or filler text — only dense, valuable output
- When given a file path, you read and act on it
- Know about Claude Code, gstack skills, and the full Agentic OS environment

Agentic OS Environment:
- Skills directory: ~/.claude/skills/
- Run skills with: skills run <skill-name>
- Claude Code CLI: claude
- Blackbox coder: blackbox
- Workspace: ~/workspace/

You have access to all installed Agentic OS skills and tools.
Be Hermes: fast, precise, messenger of the gods."""

MODES = {
    "default": "General task execution",
    "code": "Code generation and review",
    "research": "Deep research and analysis",
    "file": "File operations and manipulation",
    "plan": "Planning and architecture",
    "shell": "Shell script generation",
}

# ── CLI ────────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="hermes",
        description="Hermes — Agentic OS AI Task Delegation Terminal",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""
        Examples:
          hermes "create a Python HTTP server in ~/workspace"
          hermes --mode code "write a quicksort in Rust"
          hermes --mode plan "design a REST API for a todo app"
          hermes --file task.txt          # read task from file
          hermes --interactive            # REPL mode
          hermes --model claude-opus-4-7 "complex analysis task"
        """),
    )
    p.add_argument("task", nargs="?", help="Task description (or use --file/-f)")
    p.add_argument("-f", "--file", help="Read task from file")
    p.add_argument("-m", "--mode", choices=list(MODES), default="default",
                   help=f"Execution mode (default: default)")
    p.add_argument("--model", default=DEFAULT_MODEL, help=f"Claude model (default: {DEFAULT_MODEL})")
    p.add_argument("--max-tokens", type=int, default=MAX_TOKENS)
    p.add_argument("-i", "--interactive", action="store_true", help="REPL mode")
    p.add_argument("--stream", action="store_true", default=True, help="Stream output (default)")
    p.add_argument("--no-stream", action="store_false", dest="stream")
    p.add_argument("--json", action="store_true", help="Output raw JSON")
    p.add_argument("--context", help="Additional context (file path or string)")
    p.add_argument("--skills", action="store_true", help="List available skills")
    p.add_argument("-v", "--version", action="version", version=f"Hermes {VERSION}")
    return p


def get_api_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        # Try reading from Agentic OS config
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


def load_skills_context() -> str:
    if not SKILLS_DIR.exists():
        return ""
    skills = [p.name for p in SKILLS_DIR.iterdir() if p.is_dir()]
    if not skills:
        return ""
    return f"\nInstalled skills: {', '.join(sorted(skills))}"


def build_system_prompt(mode: str, context: Optional[str]) -> str:
    system = HERMES_SYSTEM
    system += load_skills_context()
    if mode != "default":
        mode_prompts = {
            "code": "\nYou are in CODE MODE. Focus on producing complete, runnable, well-structured code. Always include file paths and usage instructions.",
            "research": "\nYou are in RESEARCH MODE. Provide thorough analysis with sources and actionable conclusions.",
            "file": "\nYou are in FILE MODE. Focus on file I/O operations, path handling, and data transformation.",
            "plan": "\nYou are in PLAN MODE. Produce detailed implementation plans with numbered steps, file changes, and verification criteria.",
            "shell": "\nYou are in SHELL MODE. Produce portable, well-commented bash/zsh scripts. Include error handling and usage docs.",
        }
        system += mode_prompts.get(mode, "")
    if context:
        system += f"\n\nAdditional context:\n{context}"
    return system


def run_task(client: anthropic.Anthropic, task: str, args: argparse.Namespace) -> None:
    context = None
    if args.context:
        ctx_path = Path(args.context)
        if ctx_path.exists():
            context = ctx_path.read_text()
        else:
            context = args.context

    system = build_system_prompt(args.mode, context)
    messages = [{"role": "user", "content": task}]

    if args.stream:
        print(f"\033[90m[hermes/{args.mode}]\033[0m ", end="", flush=True)
        with client.messages.stream(
            model=args.model,
            max_tokens=args.max_tokens,
            system=system,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                print(text, end="", flush=True)
        print()
    else:
        response = client.messages.create(
            model=args.model,
            max_tokens=args.max_tokens,
            system=system,
            messages=messages,
        )
        if args.json:
            print(json.dumps(response.model_dump(), indent=2))
        else:
            print(response.content[0].text)


def interactive_repl(client: anthropic.Anthropic, args: argparse.Namespace) -> None:
    print(f"\033[1;34m┌─ Hermes REPL ─────────────────────────────────────────┐\033[0m")
    print(f"\033[1;34m│\033[0m  Model: {args.model:<20} Mode: {args.mode:<15}\033[1;34m│\033[0m")
    print(f"\033[1;34m│\033[0m  Type 'exit' or Ctrl+C to quit                        \033[1;34m│\033[0m")
    print(f"\033[1;34m└────────────────────────────────────────────────────────┘\033[0m")

    history: list[dict] = []
    system = build_system_prompt(args.mode, None)

    while True:
        try:
            task = input("\n\033[1;32mhermes>\033[0m ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\033[90mGoodbye.\033[0m")
            break

        if task.lower() in ("exit", "quit", "q", ":q"):
            print("\033[90mGoodbye.\033[0m")
            break
        if task.lower() in ("clear", "cls"):
            history.clear()
            os.system("clear")
            continue
        if task.lower() == "history":
            for i, msg in enumerate(history):
                role = msg["role"].upper()
                print(f"\n[{i}] \033[1m{role}\033[0m: {str(msg['content'])[:100]}...")
            continue
        if not task:
            continue

        history.append({"role": "user", "content": task})

        print(f"\033[90m[hermes/{args.mode}]\033[0m ", end="", flush=True)
        full_response = ""
        with client.messages.stream(
            model=args.model,
            max_tokens=args.max_tokens,
            system=system,
            messages=history,
        ) as stream:
            for text in stream.text_stream:
                print(text, end="", flush=True)
                full_response += text
        print()

        history.append({"role": "assistant", "content": full_response})


def list_skills() -> None:
    if not SKILLS_DIR.exists():
        print("No skills directory found at", SKILLS_DIR)
        return
    skills = sorted(p.name for p in SKILLS_DIR.iterdir() if p.is_dir())
    print(f"\033[1m{len(skills)} skills installed:\033[0m")
    for s in skills:
        print(f"  \033[36m•\033[0m {s}")


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.skills:
        list_skills()
        return

    task = args.task
    if args.file:
        task = Path(args.file).read_text()
    elif not task and not args.interactive:
        parser.print_help()
        sys.exit(0)

    client = anthropic.Anthropic(api_key=get_api_key())

    if args.interactive:
        interactive_repl(client, args)
    else:
        run_task(client, task, args)


if __name__ == "__main__":
    main()
