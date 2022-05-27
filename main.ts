const username = 'hyperupcall'

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

	const url = new URL(`https://api.github.com/users/${username}/repos`)
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
	let prefix = (arr: string[]) => arr.map((item) => `hyperupcall/${item}`)
	const categories: Record<
		string,
		{
			entries: string[]
			data: Repo[]
		}
	> = {
		Meta: {
			entries: [
				...prefix([
					'hyperupcall',
					'repos',
					'dots',
					'website',
					'blog',
					'slides',
					'containers',
					'infrastructure',
					'awesome-icons',
				]),
			],
			data: [],
		},
		Projects: {
			entries: [
				...prefix([
					'fox-css',
					'fox-night',
					'cactus',
					'cmdcap',
					'dotfox',
					'foxomate',
					'pick-sticker',
					'xdgbasedirectoryspecification.com',
					'toml-subset',
					'libfoxdebug',
					'editorconfig-lint',
					'tree-sitter-tcsh',
					'tree-sitter-bash',
				]),
			],
			data: [],
		},
		'Projects Bash': {
			entries: [
				'hyperupcall/basalt',
				'hyperupcall/awesome-basalt',
				'hyperupcall/autoenv',
				...prefix(['bake', 'woof', 'shelltest', 'hookah', 'choose', 'glue']),
				...prefix([
					'bash-core',
					'bash-object',
					'bash-std',
					'bash-algo',
					'bash-args',
					'bash-semver',
					'bash-str',
					'bash-term',
					'bash-toml',
					'bats-all',
					'bats-assert',
					'bats-core',
					'bats-file',
					'bats-support',
					'themer',
					'salamis',
					'glue',
					'glue-example',
					'glue-store',
				]),
			],
			data: [],
		},
		'Projects Deno': {
			entries: [
				...prefix([
					'config',
					'is_exe',
					'ensure',
					'deno-fox',
					'deno-http',
					'deno-search',
					'deno-debug',
				]),
			],
			data: [],
		},
		'Projects Plugins': {
			entries: [
				'fox-land/remark-insert',
				'fox-land/remark-readme',
				...prefix([
					'babel-improved-piped-pipelines',
					'babel-plugin-improved-gulp-pipelines',
					'babel-plugin-owoifier',
					'eslint-config-fox',
					'hugo-natrium-theme',
					'hexo-theme-fluid',
					'remark-starchart',
					'vscode-hyperupcall',
					'web-input-readline-hotkeys-extension',
				]),
			],
			data: [],
		},
		'Retired Shipped Projects': {
			entries: [
				'eshsrobotics/database-photos',
				'eshsrobotics/website-challenge-2019',
				...prefix([
					'word-finder',
					'periodic-table',
					'fox-suite',
					'FoxModpackRisk',
					'babel-hacklang',
					'hacklang-sucrase',
					'jqa',
					'baeuda',
					'sigag',
					'deno-babel',
					'hackclub-community',
					'tails',
					'tails-projects',
					'portable-workstation',
					'volant',
					'dockerized-mars',
					'dockerized-mmlogic',
				]),
			],
			data: [],
		},
		'Retired Canned Projects': {
			entries: [
				...prefix([
					'periodic-table-v2',
					'template-bash',
					'spectre-css-dark',
					'shell-installer',
					'bm',
					'cliflix',
					'hacktoberno-thanks',
					'plataea',
					'urocyon',
					'urocyon-cookbook',
					'gtk-tic-tac-toe',
					'paper',
					'github-dashboard',
					'awesome-git-hooks',
					'thermopylae',
					'minecraft-bot',
					'marko-feather',
					'node-licenses',
					'proposal-array-last-find-index',
					'sort-package-json',
					'radar',
					'go-logger',
					'compiler-sampler',
				]),
			],
			data: [],
		},
		'Retired Moved Projects': {
			entries: [
				...prefix([
					'dots-bootstrap',
					'dotshellextract',
					'dotshellgen',
					'bash-error',
					'bamboo',
				]),
			],
			data: [],
		},
		$Ignore: {
			entries: [
				'replit-discord/all-seeing-bot',
				'uakotaobi/notes',
				'DataSciClubECC/.github',
				'cs-club-smc/pacman-game',
				'eankeen/blog',
				'gamedevunite-at-smc/fall2021',
				...prefix([
					'repro-typescript-extension-false-positives',
					'asteroids-reloaded',
					'appliance-manager',
					'awesome-oak',
					'deno-template-oak',
					'asteroids-reloaded',
					'my-website',
				]),
			],
			data: [],
		},
	}

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

await Deno.writeTextFile('README.md', output)
