# shellcheck shell=bash

task.run() {
	deno run --allow-read --allow-write --allow-net src/main.ts
}