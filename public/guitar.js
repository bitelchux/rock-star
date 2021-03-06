import Instrument from './instrument.js';
import Synths from './synths.js';

const guitarTemplate = document.createElement('template');
guitarTemplate.innerHTML = `
<svg class="guitarBackground" width="250" height="400" xmlns="http://www.w3.org/2000/svg">
  <g>
    <rect fill="#ccc" height="325" width="250" y="0" x="0" />
    <rect fill="#fff" height="75" width="250" y="325" x="0" />    
    <line y2="400" x2="25" y1="0" x1="25" stroke-width="4" stroke="#888" stroke-dasharray="4 0.5" />
    <line y2="400" x2="75" y1="0" x1="75" stroke-width="3.5" stroke="#888" stroke-dasharray="4 0.5" />
    <line y2="400" x2="125" y1="0" x1="125" stroke-width="3" stroke="#888" stroke-dasharray="4 0.5" />
    <line y2="400" x2="175" y1="0" x1="175" stroke-width="2.5" stroke="#888" stroke-dasharray="4 0.5" />
    <line y2="400" x2="225" y1="0" x1="225" stroke-width="2" stroke="#888" />
  </g>
</svg>
<canvas style="position: absolute; top: 50px; left: 0;" class="guitar" width="250" height="400"></canvas>
<svg class="guitarControls" style="position: absolute; bottom: 15; left: 0;" width="250" height="75" xmlns="http://www.w3.org/2000/svg">
  <g>
    <rect class="control" fill="green" height="30" width="50" y="0" x="0" style="fill-opacity: .5;" />
    <rect class="control" fill="red" height="30" width="50" y="0" x="50" style="fill-opacity: .5;" />
    <rect class="control" fill="#999900" height="30" width="50" y="0" x="100" style="fill-opacity: .5;" />
    <rect class="control" fill="blue" height="30" width="50" y="0" x="150" style="fill-opacity: .5;" />
    <rect class="control" fill="darkorange" height="30" width="50" y="0" x="200" style="fill-opacity: .5;" />
  </g>
</svg>
`;

export default class Guitar extends Instrument {
  constructor(parent, settings) {
    super(parent, settings)
    this.container.querySelector('.instrument').appendChild(guitarTemplate.content.cloneNode(true));  
    parent.appendChild(this.container);  
    this.graphics = this.container.querySelector('canvas');
    
    this.colors = ['green', 'red', '#999900', 'blue', 'darkorange'];
    
    this.windowSize = 2; // Time window in seconds
    this.scale = 100; // Used map note time to graphics - to be tweaked
    this.mNoteIndex = 0; // Current position in track
    this.offset = 75;
    
    this.noteToStringMap = { D:0, E:1, F:2, G:2, A:3, B:3, C:4 };   
    this.controls = this.container.querySelectorAll('.control');
    
    this.strumReset = true;
    
    this.controls.forEach((control, i) => {
      control.onclick = () => {
        let states = [false, false, false, false, false, false];
        states[i] = true;
        this.input(states);
        states[5] = true;
        this.input(states);
        setTimeout(() => { 
          this.input([false, false, false, false, false, false]); 
        }, 100);
      }
    });    
    
    this.playerNoteRate = 0.8;
    this.backOff = this.BACK_OFF = 40;
    
    this.difficulyTimer = setInterval(() => {
      if(!this.isPlaying)
        return;
      if(this.playerNoteRate > 0.2)
        this.playerNoteRate -= 0.02;
      if(this.BACK_OFF > 10)
         this.BACK_OFF -= 0.25;
    }, 1000);
    
    this.ctx = this.graphics.getContext('2d');
  }
   
  initSynth(callback) {    
    this.errorSynth = new Tone.Sampler({
      'B0': 'buzzer.mp3'
    },{
      attack: 0,
      release: 0,
      baseUrl: './assets/'
    }).toMaster();
    this.errorSynth.volume.value = -5;
    
    return this.synth = new Synths().guitar(this.instrumentFamily, callback);
  }
  
  update(now) {
    this.backOff--;
    // Update existing notes
    this.ctx.clearRect(0, 0, 250, 400);
      
    this.gNotes.forEach((gNote, i) => {
      let y = (now - gNote.mNote.time) * this.scale - (this.scale * 2.5);
    
      if(this.playerControl && !gNote.isPlayerNote)
        this.drawShadowNote(y, gNote);
      else 
        this.drawPlayerNote(y, gNote);
      
      // Remove notes outside the render area
      if(y - gNote.length > 420) {
        this.gNotes.splice(i, 1);
      }
    });
    
    // Add new notes within the time window
    let futureNotes = this.mNotes.slice(this.mNoteIndex);
    
    futureNotes.forEach((mNote, i) => {
      if(mNote.time < now + this.windowSize && mNote.duration > 0) {
        let string = this.noteToStringMap[mNote.name.substring(0,1)]; // First charter of note only
        if(mNote.time >= 0 && !mNote.added) {
          this.addNote(string, -1000, mNote.duration * this.scale, this.colors[string], mNote);
          mNote.added = true; // Only add notes once
        }
        this.mNoteIndex = i;
      }
      if(mNote.time > now + this.windowSize)
        return;
    });
  }
  
  play(mNote) {
    if(!this.playerControl)
      mNote.gNote.isPlaying = true;
    return true;
  }
  
  drawPlayerNote(y, gNote) {
    let windowStart = 230;
    let windowEnd = 260;
    
    if(y > windowStart && y < windowEnd) {
      gNote.isInWindow = true;
      this.controls[gNote.string].note = gNote.mNote;
    }
    if(gNote.isInWindow && y > windowEnd) {
      gNote.isInWindow = false;
      this.controls[gNote.string].note = null;
      if(this.playerControl && !gNote.isPlaying)
        this.error(gNote.mNote);
    }
    
    this.ctx.beginPath();
    this.ctx.lineWidth = 30;
    this.ctx.lineCap = "round";
    this.ctx.globalAlpha = ((gNote.isPlaying) ? 0.5 : 0.2);
    this.ctx.strokeStyle = ((gNote.isError) ? 'grey' : gNote.color);
    this.ctx.moveTo(gNote.x, y + this.offset);
    this.ctx.lineTo(gNote.x, y + this.offset - gNote.length);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = ((gNote.isError) ? 'grey' : gNote.color);
    this.ctx.arc(gNote.x, y + this.offset, 4, 0, 6.28);
    this.ctx.fill();
    
    if(this.playerControl && gNote.isPlayerNote) {
      if(gNote.isInWindow) {
        this.ctx.fillStyle = gNote.color;
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 1;
        this.ctx.beginPath();
        this.ctx.arc(gNote.x, y + this.offset, 15, 0, 2 * Math.PI);
        this.ctx.stroke();
      }
      else if(y < windowStart) {
        gNote.circle = Math.abs(250 - y);
        this.ctx.lineWidth = 3;
        let opacity = 5 / gNote.circle;
        ((opacity > 0.05)? this.ctx.globalAlpha = opacity : this.ctx.globalAlpha = 0);
        this.ctx.beginPath();
        this.ctx.arc(gNote.x, y + this.offset, gNote.circle++, 0, 2 * Math.PI);
        this.ctx.stroke();
      }
    }   
  }
  
  drawShadowNote(y, gNote) {
    this.ctx.beginPath();
    this.ctx.lineWidth = 30;
    this.ctx.lineCap = "round";
    this.ctx.globalAlpha = ((gNote.isPlaying) ? 0.25 : 0.1);
    this.ctx.strokeStyle = 'grey';
    this.ctx.shadowBlur = 0;
    this.ctx.moveTo(gNote.x, y + this.offset);
    this.ctx.lineTo(gNote.x, y + this.offset - gNote.length);
    this.ctx.stroke();
  }

  addNote(string, y, length, color, mNote) {
    let x = string * 50 + 25;
    let gNote = {};
    gNote.x = x;
    gNote.color = color;
    gNote.length = length;
    gNote.string = string;
    gNote.mNote = mNote;
    gNote.isPlayerNote = false;
    gNote.isPlaying = false;
    gNote.isError = false;
    mNote.gNote = gNote;       
    if(this.isPractice || this.playerControl && this.backOff < 0 && Math.random() > this.playerNoteRate) {
      gNote.isPlayerNote = true;
      gNote.circle = 10;
      this.backOff = this.BACK_OFF;
    }
    this.gNotes.push(gNote);   
  }
  
  error(mNote) {
    this.player.miss();
    mNote.gNote.isError = true;
    let errorNotes = ['A0','B0','C0','D0','E0','F0']
    this.errorSynth.triggerAttackRelease(errorNotes[Math.floor(Math.random() * 6)], mNote.duration);
    this.playError(mNote.duration);
  }
  
  playError(duration) {
    let errorNotes = ['A0','B0','C0','D0','E0','F0']
    this.errorSynth.triggerAttackRelease(errorNotes[Math.floor(Math.random() * 6)], duration);
  }
  
  handleButton(input, state) {
    this.controls[input].on = state;
    if(state) {
      this.controls[input].setAttribute('style', `opacity: 1; outline-width:5px; outline-color:${this.colors[input]};`);
      this.controls[input].setAttribute('fill', 'transparent');
      if(this.strumOn)
        this.controls[input].setAttribute('fill', this.colors[input]);
    }
    else {
      this.controls[input].setAttribute('style', 'opacity: 0.5;');
      this.controls[input].setAttribute('stroke', 'transparent');
      this.controls[input].setAttribute('fill', this.colors[input]);
    }
  }
  
  handleStrum() {
    this.controls.forEach((control) => {
      if(control.on && control.note && control.note.gNote.isInWindow) {
        control.note.gNote.isInWindow = false;
        control.note.gNote.isPlaying = true;
        this.player.hit();
        this.synth.triggerAttackRelease(control.note.name, control.note.duration, Tone.now(), control.note.velocity);
        control.note = null;
      }
      else if(control.on && !control.note) {
        this.player.miss();
        this.playError(0.5);
      }
    });
  }
  
  input(states) {
    if(states.length === 0)
      return;
    if((states[5] || states[6]) && this.strumReset) {
      this.strumOn = true;
      if(this.isPlaying && !this.finished)
        this.handleStrum();
      this.strumOn = true;
      this.strumReset = false;
    }
    else if(!(states[5] || states[6])) {
      this.strumOn = false;
      this.strumReset = true;
    }
    
    states.forEach((state, i) => {
      if(i < 5)
         this.handleButton(i, state)
    });
  }
}