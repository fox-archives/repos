import { categories } from './categories.ts'
import * as cfg from './config.ts'

type Repo = {
	name: string
	full_name: string
	description: string
	html_url: string

	owner: {
		login: string
		url: string
		type: string
	}

	fork: boolean
	private: boolean

	stargazers_count: number
	watchers_count: string
	forks_count: string
	language: string
	license_id: string
	open_issues: number
}

let repos: Repo[] = []
{
	// Get data for all repositories
	let GITHUB_TOKEN
	try {
		GITHUB_TOKEN = await Deno.readTextFile('./.auth')
	} catch (err) {
		if (err instanceof Error) {
			if (!(err instanceof Deno.errors.NotFound)) {
				console.log(err)
				Deno.exit(1)
			}
		} else {
			console.error('Unhandled error reading auth file')
			Deno.exit(1)
		}
	}

	const url = new URL(`https://api.github.com/users/${cfg.username}/repos`)
	url.searchParams.append('type', 'all')
	url.searchParams.append('per_page', '100')

	let page = 1
	let json: typeof repos = []
	do {
		url.searchParams.set('page', String(page))
		const res = await fetch(url, {
			headers: {
				...(GITHUB_TOKEN && { Authorization: `token ${GITHUB_TOKEN}` }),
			},
		})
		if (!res.ok) {
			try {
				console.log(JSON.stringify(await res.json(), null, 2))
			} catch {
				console.log(res)
			}
			Deno.exit(1)
		}
		json = await res.json()

		repos = repos.concat(json)
		++page
	} while (json.length !== 0)
}

let output = ''
{
	// If the repository is in the response, and is specified in config, then
	// append it to the data object. After, remove it from '.entries'
	const unmatched: string[] = []
	for (const repo of repos) {
		let isFound = false
		for (const [categoryName, categoryObj] of Object.entries(categories)) {
			if (categoryObj.entries.includes(repo.full_name)) {
				isFound = true
				categoryObj.data.push(repo)

				categoryObj.entries = categoryObj.entries.filter(
					(item) => item !== repo.full_name
				)
			}
		}

		if (!isFound) {
			unmatched.push(repo.full_name)
		}
	}

	// Print repository names that weren't used in the categories object. These
	// repositories may not exist, or may be private
	for (const [categoryName, categoryObj] of Object.entries(categories)) {
		for (const item of categoryObj.entries) {
			console.log(`Unecessary: ${item} (from ${categoryName})`)
		}
	}
	// Print repository names that were not properly processed. To fix this, add
	// an entry in the categories object
	for (const item of unmatched) {
		console.log(`Unprocessed: ${item}`)
	}

	// Write to output string
	output += `# repos

The following categorizes my repositories\n`
	for (const [categoryName, categoryObj] of Object.entries(categories)) {
		if (categoryName == '$Ignore') continue

		output += `\n## ${categoryName}\n\n`
		if (categoryObj.data.length > 0) {
			for (const repo of categoryObj.data) {
				output += `- [${repo.full_name}](${repo.html_url})`
				if (repo.stargazers_count >= 4) {
					output += ` ![Total stars shield](https://shields.io/github/stars/${repo.full_name}?style=social)`
				}
				output += '\n'
			}
		}
	}
}

if (cfg.configureGitHub) {
	
}

await Deno.writeTextFile('README.md', output)
