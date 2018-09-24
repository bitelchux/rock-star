import Player from './player.js';
import Settings from './settings.js';

const template = document.createElement('template');
template.innerHTML = `
<div class="settings">
  <div class="dropdown">
    <button class="dropbtn">Computer</button>
    <div class="dropdown-content">
      <div>Computer</div>
      <div>Player 1</div>
      <div>Player 2</div>
      <div>Player 3</div>
      <div>Player 4</div>
    </div>
  </div>
</div>
<div class="infoOverlay name"></div>
<div class="infoOverlay accuracy"><span class="score">100</span>%</div>`;

export default class Instrument {    
  
  constructor(parent, players) {
    if(!parent)
      throw new Error('You have to accept the parent DOM element as a paramter!');
    else {
      this.container = document.createElement('div');
      this.container.style.position = 'relative';
      this.container.appendChild(template.content.cloneNode(true));  
      parent.appendChild(this.container);       
      this.playerControl = false;
    }
    
    this.gNotes = []; // Note graphics
    this.mNotes = []; // Note music (Tone.js)
    
    this.playerDropdownEl = this.container.querySelector('.dropbtn');
    let playerSelectEls = this.container.querySelectorAll('.dropdown-content > div');
    playerSelectEls.forEach((select, i) => {
      select.onclick = () => {
        if(select.innerHTML === 'Computer') {
          this.playerControl = false;
          this.player = null;
        }
        else {
          window.dispatchEvent(new CustomEvent('PlayerChange', {detail: {sender: this, before: this.playerDropdownEl.innerHTML, after:select.innerHTML}}));
          this.playerControl = true;
          this.player = players[i - 1];
          this.player.instrument = this;          
        }
        this.playerDropdownEl.innerHTML = select.innerHTML;
      };
    });
    
    window.addEventListener('PlayerChange', e => {
      if(e.detail.sender !== this && this.playerDropdownEl.innerHTML === e.detail.after) {
        this.playerDropdownEl.innerHTML = e.detail.before;
      }
    });
  }

  /**
   * Create your instrument synth here as 'this.synth'
   */
  initSynth() {
    throw new Error('You have to implement the method "initSynth"!');
  }
  
  /**
   * Called once per RAF with the current Tone.js time 
   */
  update(now) {
    throw new Error('You have to implement the method "update"!');
  }
  
  /**
   * Called whenever a note is played
   */
  play(note) {
    throw new Error('You have to implement the method "play"!');
  }
  
  set name(name) {
    this._name = name;
    this.container.querySelector('.name').innerHTML = name;
  }
  
  get name() {
    return this._name;
  }
  
  set accuracy(acc) {
    this.container.querySelector('.score').innerHTML = acc;
  }
}
