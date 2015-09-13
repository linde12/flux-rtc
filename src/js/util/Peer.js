import Peer from 'peerjs';
import {EventEmitter} from 'events';

class PeerEngine extends EventEmitter {
  constructor (options) {
    super();
    this.peer = new Peer(options);
    this.data = {};
    this.connections = {};

    this.peer.on('open', (id) => {
      this.peerId = id;
      this.emit('open', id);
    });
  }

  listen () {
    this.peer.on('connection', (conn) => {
      // Inform other peers of new arrival
      this.sendTo(this.connections, {
        method: 'PeerList',
        data: [conn.peer]
      });

      // Inform new arrivals of other peers
      this.sendTo(conn, {
        method: 'PeerList',
        data: Object.keys(this.connections)
      });

      // Inform self of new peer
      this.connections[conn.peer] = conn;
      this.emit('PeerList', [conn.peer]);

      conn.on('data', (data) => {
        console.log(data);
        this.parse(data);
      });

      conn.on('disconnected', () => {
        delete this.connections[conn.peer];
        this.emit('RemovePeer', conn.peer);
      });

      this.emit('connection', conn);
    });
  }

  sendTo (who, dataObj) {
    let connections;
    if (who instanceof Array) {
      connections = who;
    } else if (who.constructor === Object) {
      connections = Object.keys(who).map((id) => {
        return who[id];
      });
    } else {
      connections = [who];
    }

    connections.forEach((conn) => {
      this.send(conn, dataObj);
    });
  }

  /**
   * Parses data string to JSON and decides what to do
   * @param  {string} data Data string
   * @return {bool}      Whether an event should be emitted or not
   */
  parse (data) {
    data = JSON.parse(data);
    switch (data.method) {
      case 'PeerList':
        let peers = data.data;
        peers.forEach((peerId) => {
          this.connect(peerId);
        });
        this.emit('PeerList', peers);
        return;
      case 'Message':
        let msg = data.from + ': ' + data.data;
        this.emit('Message', msg);
        return;
    }

    console.log('Unknown event', data);
    this.emit(data);
  }

  send (conn, dataObj) {
    dataObj.from = this.peerId;
    if (conn.pc !== null) {
      conn.send(JSON.stringify(dataObj));
    } else {
      // Dead peer. Update connections and notify others
      this.emit('RemovePeer', conn.peer);
      delete this.connections[conn.peer];
      this.sendTo(this.connections, {
        method: 'RemovePeer',
        data: conn.peer
      });
    }
  }

  sendAll (data) {
    Object.keys(this.connections).forEach((id) => {
      this.send(this.connections[id], {
        method: 'Message',
        data: data
      });
    });
  }

  connect (id) {
    let conn = this.peer.connect(id);
    conn.on('open', () => {
      this.connections[conn.peer] = conn;
      this.emit('PeerList', [conn.peer]);

      conn.on('data', (data) => {
        console.log(data);
        this.parse(data);
      });

      conn.on('disconnected', () => {
        delete this.connections[conn.peer];
        this.emit('RemovePeer', conn.peer);
      });
    });
  }

  disconnect () {
    this.peer.disconnect();
    this.peer.destroy();
  }
}

export default PeerEngine;
