import Ractive from 'ractive';
import Template from '../templates/ChatTemplate.html';
import SimpleWebRTC from 'simplewebrtc';
import DesktopNotification from '../util/notify';

let Component = Ractive.extend({
  template: Template,
  oninit () {
    this.webRtc = new SimpleWebRTC({
      autoRequestMedia: true,
      receiveMedia: {
        mandatory: {
          OfferToReceiveVideo: false
        }
      }
    });

    this.webRtc.on('readyToCall', () => {
      this.webRtc.joinRoom(this.get('hash'));
      this.set('peerId', this.webRtc.connection.getSessionid());
    });

    this.webRtc.on('channelMessage', (peer, label, data) => {
      switch (data.type) {
        case 'setDisplayName':
          let peers = this.get('peers'),
            p = peers.find(function (p) { return p.id === peer.id; });
          p.nick = data.payload;
          this.set('peers', peers);
          break;
        case 'greetings':
          new DesktopNotification({
            title: 'Peer connected',
            body: 'A peer has connected to #' + this.get('hash')
          });
          break;
      }
    });

    this.webRtc.on('joinedRoom', () => {
      setTimeout(() => {
        this.webRtc.sendDirectlyToAll(this.get('hash'), 'greetings', {});
      }, 500);
    });

    this.webRtc.on('createdPeer', (peer) => {
      this.set('peers', this.webRtc.getPeers());

      peer.on('fileTransfer', (metadata, receiver) => {
        receiver.on('progress', (bytesReceived) => {
          let peers = this.get('peers'),
            p = peers.find(function (p) {
              return p.id === peer.id;
            });

          p.transferPercentage =
            Math.round((bytesReceived / metadata.size) * 100);
          p.fileData = metadata;
          this.set('peers', peers);
        });

        receiver.on('receivedFile', (file, metadata) => {
          let peers = this.get('peers'),
            p = peers.find(function (p) {
              return p.id === peer.id;
            });
          p.transferPercentage = 0;
          this.set('peers', peers);

          this.push('files', {
            href: URL.createObjectURL(file),
            name: metadata.name
          });
          receiver.channel.close();
        });
      });
    });

    this.on({
      text (evt) {
        if (evt.original.keyCode === 13) {
          let message = this.get('message');
          this.push('messages', message);
          if (message === 'dc') {
            this.peer.disconnect();
          }
          this.peer.sendAll(message);
          this.set('message', '');
        }
      },

      fileSelected (evt, id) {
        var file = evt.node.files[0],
          peer;

        peer = this.get('peers').find((peer) => {
          if (peer.id === id) {
            return true;
          }
        });
        peer.sendFile(file);
      },

      nickTyped (evt) {
        if (evt.original.keyCode === 13) {
          this.webRtc.sendDirectlyToAll(this.get('hash'), 'setDisplayName',
            this.get('peerId'));
        }
      }
    });
  },

  data () {
    return  {
      message: '',
      messages: [],
      peerId: '...',
      peers: [],
      files: []
    };
  }
});

export default Component;
