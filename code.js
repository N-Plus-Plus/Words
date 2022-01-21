document.addEventListener(`DOMContentLoaded`, function () { onLoad(); } );
window.addEventListener("mousedown", function (e) { clicked( e, true ); } );
window.addEventListener("keydown", function(e) { pressed( e ) } );


let keys = [[`q`,`w`,`e`,`r`,`t`,`y`,`u`,`i`,`o`,`p`],[`a`,`s`,`d`,`f`,`g`,`h`,`j`,`k`,`l`],[`enter`,`z`,`x`,`c`,`v`,`b`,`n`,`m`,`backspace`]]
let game = {
    keys: {}
    , word: ``
    , board: {}
    , currentRow: 0
    , over: false
    , success: null
    , diff: 5
};
let stats = {
    diff4: {
        guesses: 0
        , lost: 0
        , won: [0,0,0,0,0]
    }
    , diff5: {
        guesses: 0
        , lost: 0
        , won: [0,0,0,0,0,0]
    }
    , diff6: {
        guesses: 0
        , lost: 0
        , won: [0,0,0,0,0,0,0]
    }
}

function onLoad(){
    loadGame();
    newGame();
}

function newGame(){
    pickWord();
    for( y in keys ){
        for( x in keys[y] ){
            if( keys[y][x] !== `enter` && keys[y][x] !== `backspace`){
                game.keys[keys[y][x].toUpperCase()] = {
                    guessed: false
                    , inWord: game.word.indexOf( keys[y][x].toUpperCase() ) != -1
                };                
            }
        }
    }
    for( let i = 0; i <= game.diff + 1; i++ ){ game.board[`r${i}`] = { input: [], locked: false } }
    game.currentRow = 0;
    game.over = false;
    game.success = null;    
    buildMain();
    buildKeyboard();
}

function pickWord(){
    let n = Math.floor( Math.random() * dict[`diff${game.diff}`].choice.length );
    game.word = dict[`diff${game.diff}`].choice[n].toUpperCase();
}

function buildKeyboard(){
    let target = document.getElementById(`keyboard`);
    target.innerHTML = ``;
    for( y in keys ){
        let row = document.createElement(`div`);
        row.classList = `keyboardRow`;
        for( x in keys[y] ){
            let k = document.createElement(`div`);
            k.classList = `key`
            k.innerHTML = keys[y][x].toUpperCase();
            k.setAttribute( `key`, keys[y][x].toUpperCase() );
            if( keys[y][x] == `enter` || keys[y][x] == `backspace` ){ k.classList.add( `doubleKey`); }
            if( keys[y][x] == `enter` ){ k.innerHTML = `↵`; }
            if( keys[y][x] == `backspace` ){ k.innerHTML = `⌫`; }
            row.appendChild( k );
        }
        target.append( row );
    }
}

function buildMain(){
    let target = document.getElementById(`mainPanel`);
    target.innerHTML = ``;
    for( let i = 0; i < game.diff + 1; i++ ){
        let row = document.createElement(`div`);
        row.classList = `guessRow flexy`;
        for( let j = 0; j < game.diff; j++ ){
            let cell = document.createElement(`div`);
            cell.classList = `cell bounce blank flexy`;
            row.appendChild( cell );
        }
        target.appendChild( row );
    }
}

function pressed( e ){
    if( game.over ){}
    else if( e.keyCode == 8 ){
        if( game.board[`r${game.currentRow}`].input.length !== 0 ){
            let cell = document.querySelector(`#mainPanel`).children[game.currentRow].children[game.board[`r${game.currentRow}`].input.length-1];
            cell.innerHTML = ``;
            cell.classList.add(`bounce`);
            game.board[`r${game.currentRow}`].input.pop();
        }
    }
    else if( e.key == `Enter` ){ submitGuess(); }
    else if( (/[a-zA-Z]/).test( e.key ) && e.key.length == 1 ){
        type( e.key.toUpperCase() );
    }
}
function clicked( e ){
    let q = e.target.getAttribute(`key`);
    if( q !== null ){
        if( q == `BACKSPACE` ){ 
            let cell = document.querySelector(`#mainPanel`).children[game.currentRow].children[game.board[`r${game.currentRow}`].input.length-1];
            cell.innerHTML = ``;
            game.board[`r${game.currentRow}`].input.pop();
        }
        else if( q == `ENTER` ){ submitGuess(); }
        else{ type( q ); }
    }
    if( e.target.classList.contains(`close`) || e.target.classList.contains(`modal`) ){ newGame(); toggleModal(); }
    else if( e.target.classList.contains(`button`) ){ newGame(); toggleModal(); }
}
function type( q ){
    if( !game.over ){
        if( game.board[`r${game.currentRow}`].input.length < game.diff ){
            game.board[`r${game.currentRow}`].input.push( q );
            let cell = document.querySelector(`#mainPanel`).children[game.currentRow].children[game.board[`r${game.currentRow}`].input.length-1];
            cell.innerHTML = q;
            setTimeout(() => {
                cell.classList.remove(`bounce`);
            }, 0);
        }
    }
}

function updateBoard(){
    let target = document.getElementById(`mainPanel`);
    target.innerHTML = ``;
    for( let i = 0; i < game.diff + 1; i++ ){
        let row = document.createElement(`div`);
        row.classList = `guessRow flexy`;
        for( let j = 0; j < game.diff; j++ ){
            let cell = document.createElement(`div`);
            cell.classList = `cell bounce blank flexy`;
            if( game.board[`r${i}`].input[j] !== undefined ){ 
                if( game.currentRow > i ){
                    cell.classList = `cell flexy ${testLetter( game.board[`r${i}`].input[j], j, game.currentRow )}`;
                }
                cell.innerHTML = game.board[`r${i}`].input[j];
            }
            row.appendChild( cell );
        }
        target.appendChild( row );
    }
}

function progressRow(){
    let c = document.getElementById(`mainPanel`).children[game.currentRow];
    for( let i = 0; i < c.children.length; i++ ){
        c.children[i].classList.add( testLetter( game.board[`r${game.currentRow}`].input[i], i, game.currentRow ) );
    }
    game.currentRow++;
}

function testLetter( q, i, r ){
    if( game.word[i] == q ){ return `right`; }
    else if( game.word.indexOf( q ) != -1 ){
        // if they've all been guessed already, locked
        let count = game.word.split(q).length - 1;
        let acccount = 0;
        for( let n = 0; n < game.diff; n++ ){
            if( n == i ){}
            else if( game.board[`r${r}`].input[n] == q && game.word[n] == q ){ acccount++; }
        }
        if( count == acccount ){ return `locked` }
        // otherwsie
        else{ return `wrong`; }
    }
    else{ return `locked` }
}

function updateKeyboard(){
    for( k in game.keys ){
        if( game.keys[k].guessed ){
            let g = document.querySelector(`[key="${k}"]`);
            if( game.keys[k].inWord ){ g.classList.add(`right`); }
            else{ g.classList.add(`badKey`);}
        }
    }
}

function submitGuess(){
    if( game.board[`r${game.currentRow}`].input.length == game.diff ){
        stats[`diff${game.diff}`].guesses++;
        saveState();
        let whole = game.board[`r${game.currentRow}`].input.join(``);
        if( dict[`diff${game.diff}`].valid.findIndex( element => element == whole ) == -1 ){
            notWord();
        }
        else {
            if( whole == game.word ){
                game.success = true;
                gameOver( game.currentRow );
            }
            else{ 
                for( let i = 0; i < game.diff; i++ ){
                    let guess = game.board[`r${game.currentRow}`].input[i];
                    game.keys[`${guess}`].guessed = true;
                }
                if( game.currentRow >= game.diff ){
                    game.success = false;
                    game.over = true;
                    gameOver(game.currentRow);
                }
            }
            progressRow();
            updateKeyboard();
        }
    }
}

function gameOver( r ){
    if( game.success ){ stats[`diff${game.diff}`].won[r]++; }
    else if( !game.success ){ stats[`diff${game.diff}`].lost++; }    
    saveState();
    generateStats();
    toggleModal( game.success );
}

function notWord(){
    let w = document.querySelectorAll(`.feedback`);
    for( let i = 0; i < w.length; i++ ){
        w[i].parentElement.removeChild(w[i]);
    }
    let target = document.querySelector(`.topBar`);
    let n = document.createElement(`div`);
    n.classList = `feedback`;
    n.innerHTML = `That's not a word!`;
    target.appendChild( n );
    setTimeout(() => { n.classList.add(`fade`); }, 0 );
}

function toggleModal( success ){
    document.getElementById(`welcome`).classList.add(`unshown`);
    document.getElementById(`statPanel`).classList.remove(`unshown`);
    let m = document.querySelector(`.modal`);
    m.classList.toggle(`unshown`);
    let o = document.querySelector(`.outcome`);
    if( success ){
        o.innerHTML = `Well done!`;
    }
    else{
        o.innerHTML = `You'll get the next one for sure!`;
    }
    let w = document.querySelector(`.answer`);
    w.innerHTML = `The word was ${game.word}`;
}

var col = [ `#279277`, `#A0D468`, `#E8CE4D`,`#FC6E51`,`#EC87C0`,`#D8334A`]

function generateStats(){
    // sharable single-game
    const canvS = document.querySelector(`#share`);
    const ctxS = canvS.getContext(`2d`);
    canvS.width = document.body.clientHeight * 0.4;
    canvS.height = document.body.clientHeight * 0.4;
    ctxS.clearRect( 0, 0, document.body.clientHeight * 0.4, document.body.clientHeight * 0.4 );
    let cell = document.body.clientHeight * 0.4 / ( game.diff + 1 );
    let gap = document.body.clientHeight * 0.4 / ( cell * ( game.diff + 1 ) ) / 2;
    ctxS.strokeStyle = `#111`;
    ctxS.lineWidth = 2;
    let colLookup = { right: `#279277`, wrong: `#b39037`, locked: `#444` }
    for( let i = 0; i < game.diff + 1; i++ ){
        let y = gap + cell * i + gap * i;
        for( let j = 0; j < game.diff; j++ ){
            // get the colour
            let colour = testLetter( game.board[`r${i}`].input[j], j, i );
            let x = ( gap * 2 + cell ) + cell * j + gap * j;
            ctxS.beginPath();
            ctxS.rect( x, y, cell, cell )
            ctxS.fillStyle = colLookup[colour];
            ctxS.fill();
            ctxS.stroke();
            ctxS.closePath();
        }
    }
    // historical overview
    let watermark = Math.max( 1, stats[`diff${game.diff}`].lost );
    for( k in stats[`diff${game.diff}`].won ){ if( stats[`diff${game.diff}`].won[k] > watermark ){ watermark = stats[`diff${game.diff}`].won[k] }; };
    let target = document.getElementById(`stats`);
    target.innerHTML = ``;
    let e1 = document.createElement(`div`);
    e1.classList = `statsRow`;
    e1.innerHTML = `<div class="statsLeft">Guesses:</div><div class="statNum">${stats[`diff${game.diff}`].guesses}</div>`;
    target.appendChild( e1 );
    let e2 = document.createElement(`div`);
    e2.classList = `statsRow`;
    e2.innerHTML = `<div class="statsLeft">Losses:</div><div class="statsRight">${stats[`diff${game.diff}`].lost}</div><div class="statBar"><div class="barFill" style="width: ${ stats[`diff${game.diff}`].lost / watermark * 100 }%;"></div></div>`
    target.appendChild( e2 );
    for( let i = 0; i < game.diff + 1; i++ ){
        let e = document.createElement(`div`);
        e.classList = `statsRow`;
        e.innerHTML = `<div class="statsLeft">Turn ${i + 1}:</div><div class="statsRight">${stats[`diff${game.diff}`].won[i]}</div><div class="statBar"><div class="barFill" style="width: ${ stats[`diff${game.diff}`].won[i] / watermark * 100 }%;"></div></div>`;
        target.appendChild( e );
    }
}

function saveState(){
    localStorage.setItem( `stats` , JSON.stringify( stats ) );
}

function hardReset(){
    localStorage.clear();
    location.reload();
}

function loadGame(){
    if( JSON.parse( localStorage.getItem( `stats` ) ) !== null ){
        stats = JSON.parse( localStorage.getItem( `stats` ) );
    };
}