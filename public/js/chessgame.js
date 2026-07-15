const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const statusElement = document.querySelector(".status");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const setStatus = (message) => {
    if (statusElement) {
        statusElement.textContent = message;
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♟",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        P: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔"
    };

    const pieceKey =
        piece.color === "w"
            ? piece.type.toUpperCase()
            : piece.type.toLowerCase();

    return unicodePieces[pieceKey] || "";
};

const renderBoard = () => {
    if (!boardElement) {
        console.error("Chessboard element not found.");
        return;
    }

    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");

            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");

                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );

                pieceElement.textContent = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (!pieceElement.draggable) {
                        e.preventDefault();
                        return;
                    }

                    draggedPiece = pieceElement;
                    sourceSquare = {
                        row: rowIndex,
                        col: squareIndex
                    };

                    e.dataTransfer.setData("text/plain", "");
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();

                if (!draggedPiece || !sourceSquare) {
                    return;
                }

                const targetSquare = {
                    row: Number(squareElement.dataset.row),
                    col: Number(squareElement.dataset.col)
                };

                handleMove(sourceSquare, targetSquare);
            });

            boardElement.appendChild(squareElement);
        });
    });
    boardElement.classList.toggle("flipped", playerRole === "b");
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"
    };

    socket.emit("move", move);
};

socket.on("playerRole", (role) => {
    playerRole = role;
    setStatus(`You are playing ${role === "w" ? "White" : "Black"}.`);
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    setStatus("You are watching as a spectator.");
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("invalidMove", () => {
    setStatus("Invalid move. Try again.");
});

renderBoard();