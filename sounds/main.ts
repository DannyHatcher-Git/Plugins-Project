import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { text } from 'stream/consumers';

// Remember to rename these classes and interfaces!

interface SoundSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: SoundSettings = {
	mySetting: 'add in information'
}

export default class MyPlugin extends Plugin {
	settings: SoundSettings;

	async onload() {
		await this.loadSettings();

		// Icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('volume-2', 'Sounds Plugin', (evt: MouseEvent) => {
			// Pop up when clicked.
			new Notice('You played a sound');
		});

		// Status bar item. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('🔊');
		};

		};

		// Adds settings tab.
		this.addSettingTab(new SampleSettingTab(this.app, this));

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

// Settings tab information.

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;
	// ??
	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		// Adds information
		containerEl.createEl('h2', {text: 'Sound settings'});

		// Adds line. Then information.	
		new Setting(containerEl)
			// Adds name and description.
			.setName('First sound')
			.setDesc('Play this sound')
	}
}