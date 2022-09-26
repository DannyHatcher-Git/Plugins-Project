import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { SoundSettingTab } from 'settings';
import { Howl } from 'howler'
import audioMp3 from './sound files/audio.mp3'
import doorMp3 from './sound files/door.mp3'

interface SoundSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: SoundSettings = {
	mySetting: ''
}

export default class SoundPlugin extends Plugin {
	settings: SoundSettings;
	audio: Howl;

	async onload() {
		await this.loadSettings();

		// Status bar item. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('🔊');
		
		// Adds settings tab.
		this.addSettingTab(new SoundSettingTab(this.app, this));

		// Add a command to play me audio
		this.addCommand({
			id: 'play-me-audio',
			name: 'Play me audio',
			callback: () => {
				let sound = new Howl({
					src:[audioMp3],
					html5: true 
				})
				sound.play()
			}
		})
		// Add a command to play door audio
		this.addCommand({
			id: 'play-door-audio',
			name: 'Play door audio',
			callback: () => {
				let sound = new Howl({
					src:[doorMp3],
					html5: true 
				})
				sound.play()
			}
		})	

		// Listens for file creation.
		this.registerEvent(this.app.vault.on('create', () => {
			console.log('a new file was made')
		}));

		// Listens for file deltion.
		this.registerEvent(this.app.vault.on('delete', () => {
			console.log('a new file was deleted')
		}));

		// Not working for some reason.
		this.registerEvent(this.app.workspace.on('click',() => {
			console.log('a file was click')
		}));

		// Listens for file open.
		this.registerEvent(this.app.workspace.on('file-open',() => {
			console.log('a file was opened')
		}));

		// Listens for file menu open.
		this.registerEvent(this.app.workspace.on('file-menu',() => {
			console.log('a file menu was shown')
		}));

		// Listens for pasting in files.
		this.registerEvent(this.app.workspace.on('editor-paste',() => {
			console.log('something was pasted')
		}));
		
		// Listens for a new window.
		this.registerEvent(this.app.workspace.on('window-open',() => {
			console.log('opened window')
		}));

		// Listens for closing a window.
		this.registerEvent(this.app.workspace.on('window-close',() => {
			console.log('closed window')
		}));
	}

	onunload() {

	}

	// Load the settings. 
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	// Save the settings.
	async saveSettings() {
		await this.saveData(this.settings);
	}
}




