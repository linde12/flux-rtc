import Ractive from 'ractive';
import Template from '../templates/ChatTemplate.html';
import SimpleWebRTC from 'simplewebrtc';
import AutoLinker from 'autolinker';
import striptags from 'striptags';
import DesktopNotification from '../util/notify';

let Component = Ractive.extend({
  template: Template,
  oninit () {
    let audio = new Audio('res/audio/msg.ogg');
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
            body: 'A peer has connected to #' + this.get('hash'),
            icon: 'res/img/notification_icon.png'
          });
          let nick = this.get('peerId');

          if (nick) {
            peer.sendDirectly(this.get('hash'), 'setDisplayName', nick);
          }
          break;
        case 'chat':
          audio.play();
          this.push('messages', data.payload);
          break;
      }
    });

    this.webRtc.on('joinedRoom', () => {
      // Peers haven't been created yet... THIS UGLY
      setTimeout(() => {
        this.webRtc.sendDirectlyToAll(this.get('hash'), 'greetings', {});
      }, 1000);
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
          let msg = this.get('message');
          msg = striptags(msg);
          msg = AutoLinker.link(msg);

          let message = {
            nick: this.get('peerId'),
            message: msg
          };
          this.push('messages', message);
          this.webRtc.sendDirectlyToAll(this.get('hash'), 'chat', message);
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
      files: [],
      getTimeStamp () {
        let d = new Date();
        let hours = d.getHours();
        let prefix = hours < 10 ? '0' : '';
        return prefix + hours + ':' + d.getMinutes();
      }
    };
  }
});

export default Component;
