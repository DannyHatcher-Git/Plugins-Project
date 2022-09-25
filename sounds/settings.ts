import SoundPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class SoundSettingTab extends PluginSettingTab {
	plugin: SoundPlugin;
	// ??
	constructor(app: App, plugin: SoundPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
    display(): void {
		const {containerEl} = this;
		// Prevents added containers on open.
		containerEl.empty();
		// Adds information.
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
					// Change the mySetting value.
					this.plugin.settings.mySetting = value;
					// ??
					await this.plugin.saveSettings();
				}))
	}
}