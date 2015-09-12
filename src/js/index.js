import Ractive from 'ractive';
import Template from './templates/MainTemplate.html';
import ChatComponent from './components/ChatComponent';
import ConnectComponent from './components/ConnectComponent';
import Peer from 'peerjs';

new Ractive({
  template: Template,
  oninit () {
    this.peer = new Peer({key: 'tv3jrgxh5aeb3xr'});
    this.peer.on('open', (id) => {
      this.set('peerId', id);
    });

    this.peer.on('connection', (conn) => {
      this.push('messages', conn.id + ' has connected.');
      this.push('connections', conn);

      conn.on('data', (data) => {
        console.log(data);
        this.push('messages', data);
        this.update();
        console.log(this.get());
      });
    });

    if (window.location.hash !== '') {
      this.connection = this.peer.connect(
        window.location.hash.replace('#', ''));
      this.connection.on('open', () => {
        this.connection.send('Hello world!');
      });
    }
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
  sendMessage (message) {
    this.connection.send(message);
  },
  el: 'main'
});
