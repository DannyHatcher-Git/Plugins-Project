import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { SoundSettingTab } from 'settings';
import { Howl } from 'howler'
import audioMp3 from './audio.mp3'

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

		this.audio = new Howl({src:[audioMp3]})
		
		this.addCommand({
			id: 'play-file',
			name: 'Play file',
			callback: () => {
				let sound = new Howl({
					src:[audioMp3],
					html5: true 
				})
				sound.play()
			}
		})
	
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




