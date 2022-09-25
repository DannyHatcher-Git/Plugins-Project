import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { SoundSettingTab } from 'settings';

interface SoundSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: SoundSettings = {
	mySetting: ''
}

export default class SoundPlugin extends Plugin {
	settings: SoundSettings;

	async onload() {
		await this.loadSettings();

		// Icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('volumne-2', 'Sounds Plugin', (evt: MouseEvent) => {
			// Pop up when clicked.
			new Notice('You played a sound');
		});

		// Status bar item. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('🔊');
		
		// Adds settings tab.
		this.addSettingTab(new SoundSettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled. ??
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}
	// ??
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	// ??
	async saveSettings() {
		await this.saveData(this.settings);
	}
}




