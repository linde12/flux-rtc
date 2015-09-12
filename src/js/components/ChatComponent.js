import Ractive from 'ractive';
import Template from '../templates/ChatTemplate.html';
import Peer from 'peerjs';

let Component = Ractive.extend({
  template: Template,
  oninit() {
    this.on({
      text: (evt) => {
        if (evt.original.keyCode === 13) {
          let message = this.get('message');
          this.push('messages', message);
          this.sendMessage(message);
          this.set('message', '');
        }
      }
    });

    this.peer = new Peer({key: 'tv3jrgxh5aeb3xr'});
    this.peer.on('open', (id) => {
      this.set('peerId', id);
    });

    this.peer.on('connection', (conn) => {
      this.connection = conn;
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
        console.log(arguments);
        this.connection.send('Hello world!');
      });
    }
  },
  data() {
    return  {
      message: '',
      messages: [],
      roomId: '',
      peerId: '',
      connections: []
    };
  },
  sendMessage (message) {
    this.connection.send(message);
  }
});

export default Component;
