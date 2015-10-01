import Ractive from 'ractive';
import Template from '../templates/ChatTemplate.html';
import WebRTC from '../util/WebRTC';

let Component = Ractive.extend({
  template: Template,
  oninit () {
    this.on({
      text: (evt) => {
        if (evt.original.keyCode === 13) {
          let message = this.get('message');
          this.push('messages', message);
          if (message === 'dc') {
            this.peer.disconnect();
          }
          this.peer.sendAll(message);
          this.set('message', '');
        }
      }
    });

    WebRTC.on('readyToCall', function () {
      WebRTC.joinRoom(window.location.hash);
      setTimeout(() => {
        console.log(WebRTC.getPeers());
      }, 3000);
    });
  },
  data () {
    return  {
      message: '',
      messages: [],
      roomId: '',
      peerId: '',
      peers: []
    };
  }
});

export default Component;
