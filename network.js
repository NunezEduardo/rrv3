const Network = {
    peer: null,
    conn: null,
    isHost: false,
    isConnected: false,
    localId: null,
    remoteId: null,

    // Callbacks
    onConnect: null,
    onData: null,
    onDisconnect: null,

    init(isHost = true, targetId = null) {
        this.isHost = isHost;

        // Cleanup old peer if exists
        if (this.peer) this.peer.destroy();

        // Initialize PeerJS
        // Note: Using default public server for simplicity. 
        // For production, a private server is recommended for reliability.
        this.peer = new Peer(null, {
            debug: 2
        });

        this.peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            this.localId = id;

            if (this.isHost) {
                this.setupHostUI(id);
                this.listenForConnection();
            } else if (targetId) {
                this.connectToPeer(targetId);
            }
        });

        this.peer.on('error', (err) => {
            console.error(err);
            alert('Connection Error: ' + err.type);
        });
    },

    setupHostUI(id) {
        const url = new URL(window.location.href);
        url.searchParams.set('join', id);

        const linkInput = document.getElementById('share-link');
        const qrContainer = document.getElementById('qrcode-container');
        const hostUI = document.getElementById('host-ui');
        const status = document.getElementById('coop-status');
        const dots = document.querySelectorAll('.status-dot');

        if (linkInput && qrContainer && hostUI) {
            linkInput.value = url.toString();
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: url.toString(),
                width: 180,
                height: 180
            });
            hostUI.classList.remove('hidden');

            // Add copy listener
            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    linkInput.select();
                    document.execCommand('copy');
                    copyBtn.textContent = '¡Copiado!';
                    setTimeout(() => copyBtn.textContent = 'Copiar Link', 2000);
                };
            }
        }

        dots.forEach(d => d.classList.add('connecting'));
        if (status) status.textContent = 'Esperando Jugador 2...';
    },

    listenForConnection() {
        this.peer.on('connection', (conn) => {
            console.log("Incoming connection from", conn.peer);
            this.handleConnection(conn);
        });
    },

    connectToPeer(id) {
        const status = document.getElementById('status-text');
        const dots = document.querySelectorAll('.status-dot');
        if (status) status.textContent = 'Buscando Host...';
        dots.forEach(d => d.classList.add('connecting'));

        console.log("Connecting to peer:", id);
        this.conn = this.peer.connect(id);

        // Handle connection errors specifically
        this.conn.on('error', (err) => {
            console.error("Connection specific error:", err);
            alert("Error al conectar con Host.");
        });

        this.handleConnection(this.conn);
    },

    handleConnection(conn) {
        this.conn = conn;

        this.conn.on('open', () => {
            this.isConnected = true;
            console.log('Connected to: ' + conn.peer);

            const status = document.getElementById('coop-status') || document.getElementById('status-text');
            const dots = document.querySelectorAll('.status-dot');

            if (status) status.textContent = '¡Conectado! Iniciando...';
            dots.forEach(d => {
                d.classList.remove('connecting');
                d.classList.add('connected');
            });

            if (this.onConnect) this.onConnect();
        });

        this.conn.on('data', (data) => {
            if (this.onData) this.onData(data);
        });

        this.conn.on('close', () => {
            console.log("Connection closed");
            this.isConnected = false;
            const dots = document.querySelectorAll('.status-dot');
            dots.forEach(d => d.classList.remove('connected'));

            if (this.onDisconnect) this.onDisconnect();
            alert('Conexión perdida');
            window.location.reload();
        });
    },

    send(data) {
        if (this.isConnected && this.conn) {
            this.conn.send(data);
        }
    }
};
