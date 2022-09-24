import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { text } from 'stream/consumers';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'add in information'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// Icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'My Plugin', (evt: MouseEvent) => {
			// Pop up when clicked.
			new Notice('You pushed the left ribbon button');
		});
		// Perform additional things with the ribbon ??
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Status bar item. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Words in the Status Bar Text');

		// New command. Open SampleModal
		this.addCommand({
			id: 'first-command',
			name: 'First command',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// Adds text to editor.
		this.addCommand({
			id: 'editor-command',
			name: 'Add text',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('This is fun!');
			}
		});
		// Checks before execution. Needs a markdown window active.
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// Adds settings tab.
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin) ??
		// Using this function will automatically remove the event listener when this plugin is disabled. ??
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

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

// Part of First command.
class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}
	// Opens text box.
	onOpen() {
		const {contentEl} = this;
		contentEl.setText('I did it.');
	}
	// Closes text box
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
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
		containerEl.createEl('h1', {text: 'Heading 1'});

		containerEl.createEl('h2', {text: 'Heading 2'});

		// Adds line. Then information.	
		new Setting(containerEl)
			// Adds name and description.
			.setName('Setting Name')
			.setDesc('A description')
			// Adds input box.
			.addText(text => text
				// Creates a value to save information.
				.setValue(this.plugin.settings.mySetting)
				// Placeholder text.
				.setPlaceholder('Placeholder text')
				// When text is changed trigger.
				.onChange(async (value) => {
					// Adds a message in the console log.
					console.log('Secret: ' + value);
					// Change the mySetting value.
					this.plugin.settings.mySetting = value;
					// ??
					await this.plugin.saveSettings();
				}))
	}
}