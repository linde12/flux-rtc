import Ractive from 'ractive';
import Template from '../templates/ChatTemplate.html';
import Peer from '../util/Peer';

let Component = Ractive.extend({
  template: Template,
  oninit() {
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

    this.peer = new Peer({key: 'tv3jrgxh5aeb3xr'});
    this.peer.listen();
    this.peer.on('open', (id) => {
      this.set('peerId', id);
    });

    if (window.location.hash !== '') {
      this.peer.connect(window.location.hash.replace('#', ''));
    }

    this.peer.on('Message', (data) => {
      this.push('messages', data);
    });

    this.peer.on('PeerList', (peers) => {
      peers.forEach((peerId) => {
        this.push('peers', peerId);
      });
    });

    this.peer.on('RemovePeer', (peer) => {
      let peers = this.get('peers');
      peers.splice(peers.indexOf(peer), 1);
      this.merge('peers', peers);
    });
  },
  data() {
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
