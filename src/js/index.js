import Ractive from 'ractive';
import Template from './templates/MainTemplate.html';
import ChatComponent from './components/ChatComponent';
import ConnectComponent from './components/ConnectComponent';

new Ractive({
  template: Template,
  oninit () {

  },
  components: {
    ChatComponent: ChatComponent,
    ConnectComponent: ConnectComponent
  },
  data () {
    return {
      roomId: window.location.hash,
      messages: [],
      connections: []
    };
  },
  el: 'main'
});
