#!/usr/bin/env python3
import sys
import json
import subprocess
import argparse
import re
from pathlib import Path
from typing import TypedDict


class Plugin(TypedDict):
	namePretty: str
	name: str
	url: str
	badgeSvg: str
	badgeUrl: str

def actionInstallPluginsRepo():
	subprocess.run(['rm', '-rf', './.data/asdf-plugins'])
	subprocess.run(['git', 'clone', '--depth=1', 'https://github.com/asdf-vm/asdf-plugins', './.data/asdf-plugins'])

def actionCreatePluginsJsonFile():
	plugins_dir = '.data/asdf-plugins/plugins'
	readme_file = '.data/asdf-plugins/README.md'

	entries: list[str] = []
	for plugin_file in Path(plugins_dir).glob('*'):
		content = plugin_file.read_text()
		if content.count('\n') != 1:
			print(f"WARNING: File does not contain one newline: {plugin_file.absolute()}", file=sys.stderr)

		remote_url = str(content.strip().split('=')[1].strip().rstrip('.git'))
		name = remote_url[remote_url.rindex('/'):]
		entries.append(f':{remote_url}')
	entries.sort()
	Path('./.data/plugins-from-directory.txt').write_text('\n'.join(entries) + '\n')

	Repo = TypedDict('Repo', { 'namePretty': str, 'name': str, 'url': str, 'badgeSvgUrl': str, 'badgeUrl': str })
	Obj = TypedDict('Obj', { 'repos': list[Repo] })
	obj: Obj = { 'repos': [] }
	entries = []
	matches = re.findall('^\\|[\\t ]*(?P<namePretty>.*?)\\|[\\t ]*\\[(?P<repoUrlText>.*?)\\]\\((?P<repoUrl>.*?)\\)[\\t ]*\\|[\\t ]*\\[!\\[(?P<badgeText>.*?)\\]\\((?P<badgeLink>.*?)\\)\\]\\((?P<badgeUrl>.*?)\\)', Path(readme_file).read_text(), re.MULTILINE)
	for match in matches:
		namePretty: str = match[0].strip()
		repoUrlText: str = match[1]
		repoUrl: str = match[2]
		badgeText: str = match[3]
		badgeSvgUrl: str = match[4]
		badgeUrl: str = match[5]

		name = repoUrl
		name = name[name.rindex('/')+1:]
		entries.append(f'{name}:{repoUrl}')
		obj['repos'].append({
			'namePretty': namePretty,
			'name': repoUrl[repoUrl.rindex('/')+1:],
			'url': repoUrl,
			'badgeSvgUrl': badgeSvgUrl,
			'badgeUrl': badgeUrl
		})

	entries.sort()
	Path('./.data/plugins-from-readme.txt').write_text('\n'.join(entries) + '\n')
	Path('./plugins.json').write_text(json.dumps(obj))


def actionCreatePluginsXmlFile():
	pluginsJson = json.loads(Path('plugins.json').read_text())

	# Sometimes, a single repository shows twice. So, ensure
	# there are no duplicates.
	unique_plugins: list[Plugin] = []
	for plugin in pluginsJson['plugins']:
		url_exists = False

		for plugin_unique in unique_plugins:
			if plugin_unique['name'].split('/')[-1] == plugin['name'].split('/')[-1]:
				url_exists = True
				break

		if not url_exists:
			unique_plugins.append(plugin)


	s = ''
	pre = "<?xml version='1.0' encoding='UTF-8'?>\n<manifest>\n"
	post = '</manifest>'
	for plugin in unique_plugins:
		print(f'Adding {plugin["name"]} to plugins.xml')

		end = plugin['name'].split('/')[-1]
		name = plugin['name']
		revision = subprocess.run(['bash', '-c', f"git remote show '{plugin['url']}' | grep 'HEAD branch' | cut -d' ' -f5"], stdout=subprocess.PIPE).stdout.decode('utf-8').strip()

		s += f'     <project name="{name}" revision="{revision}" path="repos/{end}" />\n'
	Path('plugins2.xml').write_text(pre + s + post)

def main():
	parser = argparse.ArgumentParser(prog='task', description='Execute a task')
	parser.add_argument('action', choices=['install-plugins-repo', 'create-plugins-json-file', 'create-plugins-xml-file', 'all'])

	args = parser.parse_args()
	if args.action == 'install-plugins-repo':
		actionInstallPluginsRepo()
	elif args.action == 'create-plugins-json-file':
		actionCreatePluginsJsonFile()
	elif args.action == 'create-plugins-xml-file':
		actionCreatePluginsXmlFile()
	elif args.action == 'all':
		actionInstallPluginsRepo()
		actionCreatePluginsJsonFile()
		actionCreatePluginsXmlFile()

if __name__ == '__main__':
	main()
