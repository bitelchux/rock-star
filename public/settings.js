
export default class Settings {
  
  constructor(element, controllers) {
    this.settingsEl = element;
    this.controllers = controllers;
    this.controllers.onOk = () => { this.showSettings() };
    this.controllers.onCancel = () => { this.showSettings() };
    this.players = [1,2,3,4];
    this.showSettings();
  }
   
  showSettings() {
    this.settingsEl.innerHTML = `
      <p>Assign player controls:</p>
      <ul class="playerList">
        ${this.players.map((player, i) => `<li class="playerConfigLI">
          <span>Player ${i + 1}</span>
          <select class="controllerSelect">
            <option value="keyboard">Keyboard</option>
            ${this.controllers.availableControllers.map((controller, i) => `<option value="${i}">${controller.id}</option>`).join('')}
          </select>
          <img class="configureControllerIcon icon settingsIcon" src="./icons/settings.svg">
        </li>`).join('')}
      </ul>
      <button class="dialogButton" id="buttonSettingsCancel">Cancel</button>
      <button class="dialogButton" id="buttonSettingsOk">Ok</button>
    `;    
    
    this.settingsEl.querySelector('#buttonSettingsCancel').onclick = (e) => { this.onCancel(); };
    this.buttonSettingsOk = this.settingsEl.querySelector('#buttonSettingsOk');
    this.buttonSettingsOk.style.float = 'right';
    this.buttonSettingsOk.onclick = (e) => { this.onOk(); };
    
    let icons = this.settingsEl.querySelectorAll('.configureControllerIcon');
    let itemEls = this.settingsEl.querySelectorAll('.playerConfigLI');
    icons.forEach((icon, i) => {
      icon.onclick = (e) => { 
        let controller = itemEls[i].querySelector('.controllerSelect').value;
        if(controller === 'keyboard')
          alert('Coming soon!');
        else 
          this.controllers.configure(i, parseInt(controller));
      };
    });
  }
  
  onCancel() {
    console.error('Must provide an implmentation of onCancel');
  }
  
  onOk() {
    console.error('Must provide an implmentation of onOk');
  }
}