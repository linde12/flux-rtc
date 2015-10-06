import Ractive from 'ractive';
import Template from './templates/MainTemplate.html';
import ChatComponent from './components/ChatComponent';

new Ractive({
  template: Template,
  oninit () {
    this.on({
      input (event) {
        if (event.original.keyCode === 13) {
          window.location.hash = this.get('roomName');
          this.set('hash', this.get('roomName'));
        }
      }
    });
  },
  components: {
    ChatComponent: ChatComponent
  },
  data () {
    return {
      hash: window.location.hash.replace('#', ''),
      roomName: ''
    };
  },
  el: 'main'
});
