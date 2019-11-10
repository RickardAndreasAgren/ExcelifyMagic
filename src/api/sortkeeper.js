
import {logui} from '../util/printui.js';
import optionText from './optionText.js';
/*

*/

class Sortkeeper {
  constructor(name, activator) {
    this.id = name;
    this.aid = activator;
    this.options = {};
    this.selected = '';
    this.override = null;
    this.active = false;

    this.setOverride = this.setOverride.bind(this);
    this.overrideOption = this.overrideOption.bind(this);
    this.triggerOnChange = this.triggerOnChange.bind(this);
    this.isActiveChange = this.isActiveChange.bind(this);
    this.removeOption = this.removeOption.bind(this);
    this.addOption = this.addOption.bind(this);
    this.getSelected = this.getSelected.bind(this);
    this.activateOnChange();
  }

  getSelected() {
    return this.selected;
  }

  setOverride(callback) {
    this.override = callback;
  }

  activateOnChange() {
    const myNode = document.getElementById(this.id);
    myNode.onchange = this.triggerOnChange;
    const aNode = document.getElementById(this.aid);
    aNode.onchange = this.isActiveChange;
  }

  isActiveChange() {
    const aNode = document.getElementById(this.aid);
    this.active = aNode.checked;
  }

  triggerOnChange() {
    const myNode = document.getElementById(this.id);
    let newSelection = myNode.options[myNode.selectedIndex];
    this.selected = newSelection.text;
    if (this.override) {
      let o = this.override(newSelection.text);
    }
  }

  overrideOption(selectedName) {
    const myNode = document.getElementById(this.id);
    if (this.selected === selectedName) {
      this.selected = this.options[Object.keys(this.options)[0]];
      let toBeSelected = myNode.options.namedItem(this.selected);
      myNode.selectedIndex = toBeSelected;
    }
  }

  removeOption(optionName) {
    if (this.options[optionName]) {
      if (Object.keys(this.options).length === 1) {
        this.selected = '';
      }

      delete this.options[optionName];
      if (this.selected === optionName) {
        this.selected = this.options[Object.keys(this.options)[0]];
      }

      const myNode = document.getElementById(this.id);
      let removeThis = myNode.options.namedItem(optionName);
      myNode.remove(removeThis.index);
      let toBeSelected = myNode.options.namedItem(this.selected);
      myNode.selectedIndex = toBeSelected;
    }
    return 0;
  }

  addOption(optionName) {
    if (!this.options[optionName]) {
      var myNode = document.getElementById(this.id);
      this.options[optionName] = optionName;
      let addThis = document.createElement('option');
      addThis.value = this.options[optionName];
      addThis.text = optionText[optionName];
      addThis.id = this.options[optionName]

      myNode.add(addThis);

      if (this.selected === '') {
        this.selected = optionName;
      }
    }
  }

  redrawOptions() {
    const myNode = document.getElementById(this.id);

    for (let option in this.options) {
      let activeOption = {};
      activeOption.value = this.options[option];
      activeOption.text = this.options[option];
      if (this.selected == activeOption.text) {
        activeOption.selected = true;
      }
      myNode.add(activeOption);
    }
  }

  resetOptions() {
    const myNode = document.getElementById(this.id);
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }
  }
}

export default Sortkeeper;
