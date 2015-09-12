import Ractive from 'ractive';
import Template from '../templates/ChatTemplate.html';

let Component = Ractive.extend({
  template: Template,
  oninit() {
    this.on({
      text: (evt) => {
        if (evt.original.keyCode === 13) {
          let message = this.get('message');
          this.push('messages', message);
          this.parent.sendMessage(message);
          this.set('message', '');
        }
      }
    });
  },
  data() {
    return  {
      message: '',
      messages: []
    };
  }
});

export default Component;
