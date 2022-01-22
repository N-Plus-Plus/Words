document.addEventListener(`DOMContentLoaded`, function () { onLoad(); } );
window.addEventListener("mousedown", function (e) { clicked( e, true ); } );
window.addEventListener("keydown", function(e) { pressed( e ) } );
window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  });


let keys = [[`q`,`w`,`e`,`r`,`t`,`y`,`u`,`i`,`o`,`p`],[`a`,`s`,`d`,`f`,`g`,`h`,`j`,`k`,`l`],[`enter`,`z`,`x`,`c`,`v`,`b`,`n`,`m`,`backspace`]];
let hintKeys = [`Q`,`J`,`Z`,`X`,`V`,`K`,`W`,`Y`,`F`,`B`,`G`,`H`,`M`,`P`,`D`,`U`,`C`,`L`,`S`,`N`,`T`,`O`,`I`,`R`,`A`,`E`];
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
    diff4: { guesses: 0, lost: 0, won: [0,0,0,0,0], notWord: 0 }
    , diff5: { guesses: 0, lost: 0, won: [0,0,0,0,0,0], notWord: 0 }
    , diff6: {guesses: 0, lost: 0, won: [0,0,0,0,0,0,0], notWord: 0 }
}
let settings = {
    sounds: false
    , hints: false
    , doubles: false
}
var newGameOnClose = false;

let messages = {
    great: [`Did you cheat?`,`Outstanding!`,`Amazing!`,`Ermagerd!`,`Fantastic!`,`So good!`,`Great guess!`,`Best one yet!`,`Champion!`]
    , good: [`Pretty good!`,`Hey! Nice one!`,`Strong guess!`,`Good job!`,`Ooh, nice!`,`That went well!`,`You're good at this!`,`Very nice!`,`Oh yeah!`]
    , okay: [`Meh.`,`Not bad...`,`That was alright.`,`So-so.`,`I tried that too.`,`Not the worst.`,`You'll get it.`,`Different strat?`,`Keep at it.`]
    , bad: [`Not even close`,`Nope, sorry`,`Bup-bowm`,`Don't feel bad`,'Uh-uh',`Need a break?`,'You can do better.',`Afraid not...`,`Not ideal...`]
    , terrible: [`Were you trying?`,`Well that sucks.`,`Not even one!`,`Z-z-z-ero!`,`Stike one!`,`I believe in you!`,`This one's hard.`,`All up from here.`,`I feel bad too.`]
    , stepUp: [`A+ Improvement`,`Sea change!`,`Upswing!`,`Nice comeback!`,`Gaining ground!`,`Hot streak?`,`Moving on up!`,`Such improve!`,`That's the way!`]
    , stepDown: [`You had this...`,`Swing and a miss.`,`Took a risk there.`,`No bueno.`,`Losing ground...`,`Getting worse?`,`That hurts...`,`That's worse...`,`Don't lose hope...`]
    , notReal: [`Wild stabbing?`,`C'mon, really?`,`Try harder!`,`Rules is rules.`,`Too you too!`,`Gazuntite!`,`Bless you!`,`Real words only.`,`Quit doing that.`,`So not real.`,`English pls.`,`Excuse me?`,`Never heard it.`,`That's not real.`,`Not a thing.`,`What is that?`,`Not in my lexicon.`,`Making things up?`]
}

function onLoad(){
    document.title = `O \u205f​​​\u205f​​​R \u205f​​​\u205f​​​D \u205f​​​\u205f​​​S`;
    loadGame();
    newGame();
}

function newGame(){
    pickWord();
    let arr = game.word.split(``);
    for( y in keys ){
        for( x in keys[y] ){
            if( keys[y][x] !== `enter` && keys[y][x] !== `backspace`){
                let q = keys[y][x].toUpperCase();        
                game.keys[q] = {
                    guessed: false
                    , inWord: game.word.indexOf( q ) != -1
                    , multi: arr.filter( e => e == q ).length > 1
                };                
            }
        }
    }
    game.guesses = {};
    for( let i = 0; i <= game.diff + 1; i++ ){
        game.board[`r${i}`] = { input: [], locked: false }
        game.guesses[`g${i}`] = {};
        game.guesses[`g${i}`].notReal = 0;
        game.guesses[`g${i}`].eval = null;
    }
    game.currentRow = 0;
    game.over = false;
    game.success = null;
    game.hinted = false;
    buildMain();
    buildKeyboard();
    updateHintState();
    clearFeedback();
}

function pickWord(){
    let n = Math.floor( Math.random() * dict[`diff${game.diff}`].choice.length );
    game.word = dict[`diff${game.diff}`].choice[n].toUpperCase();
}

function buildKeyboard(){
    let target = document.getElementById(`keyboard`);
    target.innerHTML = ``;
    let mobile = ``;
    if( document.body.clientHeight > document.body.clientWidth ){
        mobile = `M`;
        target.classList.add(`mobile`);
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    for( y in keys ){
        let row = document.createElement(`div`);
        row.classList = `keyboardRow`;
        for( x in keys[y] ){
            let k = document.createElement(`div`);
            k.classList = `${mobile}key`
            k.innerHTML = keys[y][x].toUpperCase();
            k.setAttribute( `key`, keys[y][x].toUpperCase() );
            if( keys[y][x] == `enter` || keys[y][x] == `backspace` ){ k.classList.add( `${mobile}doubleKey`); }
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
    else if( e.key == `Enter` ){
        if( document.querySelector(`.modal`).classList.contains(`unshown`) ){ submitGuess(); }
        else{ toggleModal(); newGame(); }        
    }
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
    if( e.target.classList.contains(`close`) || e.target.classList.contains(`modal`) ){
        if( document.getElementById(`settings`).classList.contains(`unshown`) ){ newGame(); toggleModal(); }
        else{ toggleSettings(); }
    }
    else if( e.target.classList.contains(`button`) ){ toggleModal(); newGame(); }
    else if( e.target.classList.contains(`diffChange`) ){
        if( e.target.getAttribute(`data-diff`) == null ){}
        else if( e.target.getAttribute(`data-diff`) !== `x` ){
            game.diff = parseInt( e.target.getAttribute(`data-diff`) );
            toggleModal();
            newGame();
        }
    }
    else if( e.target.classList.contains(`setting`) ){
        let s = e.target.getAttribute(`data-setting`);
        if( s == `difficulty` ){
            let d = [`Four in Five`,`Five in Six`,`Six in Seven`,`Four in Five`];
            let dd = [ 4, 5 ,6, 4 ];
            let ind = dd.indexOf( game.diff );
            document.querySelector(`[data-setting="difficulty"]`).innerHTML = d[ind+1];
            game.diff = dd[ind+1];
            settings.difficulty = dd[ind+1];
            newGameOnClose = true;
        }
        else{ settings[s] = !settings[s]; }
        saveState();
        updateSettingButtons();
        updateHintState();
    }
    else if( e.target.classList.contains(`settings`) ){
        toggleSettings();
    }
    else if( e.target.classList.contains(`hint`) ){
        doHint();
    }
}
function type( q ){
    if( !game.over ){
        if( game.board[`r${game.currentRow}`].input.length < game.diff ){
            game.board[`r${game.currentRow}`].input.push( q );
            let cell = document.querySelector(`#mainPanel`).children[game.currentRow].children[game.board[`r${game.currentRow}`].input.length-1];
            cell.innerHTML = q;
            setTimeout(() => { cell.classList.remove(`bounce`); }, 0 );
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
    let count = game.word.split(q).length - 1;
    let account = 0;
    for( let n = 0; n < game.diff; n++ ){
        if( game.board[`r${r}`].input[n] == q ){ account++; }
    }
    if( game.word[i] == q ){
        if( settings.doubles ){
            if( count <= account ){ return `right`; }
            else{ return `rightand`;}
        }
        else{ return `right`; }
    }
    else if( count > 0 ){
        if( settings.doubles ){
            if( count <= account ){ return `wrong`; }
            else{ return `wrongand`;}
        }
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
            document.get
        }
        else {
            let q = generateFeedback()
            if( Math.random() < 0.5 ){
                guessFeedback( q, false );
            }
            if( whole == game.word ){
                game.success = true;
                gameOver( game.currentRow );
                guessFeedback( `You got it!`, false );
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
                    guessFeedback( `Dang it!`, false );
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
    stats[`diff${game.diff}`].notWord++;
    game.guesses[`g${game.currentRow}`].notReal++;
    if( game.guesses[`g${game.currentRow}`].notReal > 1 && game.guesses[`g${game.currentRow}`].notReal < 5 ){
        guessFeedback( messages.notReal[Math.floor( Math.random() * messages.notReal.length )], true );
    }
    else{ guessFeedback( `That's not a word!`, true ); }
}

function generateFeedback(){
    let eval = 0;
    for( let i = 0; i < game.board[`r${game.currentRow}`].input.length; i++ ){
        let result = testLetter( game.board[`r${game.currentRow}`].input[i], i, game.currentRow );
        if( result == `right` || result == `right and` ){ eval += 10; }
        else if( result == `wrong` || result == `wrong and` ){ eval += 3; }
    }
    let type = ``;
    if( game.currentRow > 0 ){
        if( game.guesses[`g${game.currentRow - 1}`].eval > eval + 10 ){ type = `stepDown`; }
        else if( game.guesses[`g${game.currentRow - 1}`].eval < eval - 15 ){ type = `stepUp`; }
    }
    if( type == `` ){
        if( eval == 0 ){ type = `terrible`; }
        else if( eval < 10 ){ type = `bad`; }
        else if( eval < 20 ){ type = `okay`; }
        else if( eval < 30 ){ type = `good`; }
        else{ type = `great`; }
    }
    let nonce = Math.floor( Math.random() * messages[type].length );
    game.guesses[`g${game.currentRow}`].eval = eval;
    return messages[type][nonce];

    // stepIUp, stepDown, notReal
}

function guessFeedback( q, err ){    
    clearFeedback();
    let target = document.querySelector(`.topBar`);
    let n = document.createElement(`div`);
    n.classList = `feedback`;
    if( err ){ n.classList.add(`notWord`); }
    n.innerHTML = q;
    target.appendChild( n );
    setTimeout(() => { n.classList.add(`fade`); }, 0 );
}

function clearFeedback(){
    let w = document.querySelectorAll(`.feedback`);
    for( let i = 0; i < w.length; i++ ){
        w[i].parentElement.removeChild(w[i]);
    }
}

function toggleModal( success ){
    adjustModalBottom();
    document.getElementById(`welcome`).classList.add(`unshown`);
    document.getElementById(`statPanel`).classList.remove(`unshown`);
    document.getElementById(`settings`).classList.add(`unshown`);
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

function toggleSettings(){
    document.getElementById(`welcome`).classList.add(`unshown`);
    document.getElementById(`statPanel`).classList.add(`unshown`);
    document.getElementById(`settings`).classList.remove(`unshown`);
    let m = document.querySelector(`.modal`);
    m.classList.toggle(`unshown`);
    updateSettingButtons();
    if( newGameOnClose ){
        newGameOnClose = false;
        saveState();
        newGame();
    }
}

function updateSettingButtons(){
    for( s in settings ){
        let target = document.querySelector(`[data-setting="${s}"]`);
        if( s == `difficulty` ){
            let d = [`Four in Five`,`Five in Six`,`Six in Seven`,`Four in Five`];
            let dd = [ 4, 5 ,6, 4 ];            
            let ind = dd.indexOf( game.diff );
            target.innerHTML = d[ind];
        }
        else if( settings[s] ){
            target.classList.remove(`off`);
            target.innerHTML = `Turn Off`;
        }
        else{
            target.classList.add(`off`);
            target.innerHTML = `Turn On`;
        }
    }
}

function updateHintState(){
    let h = document.querySelector(`.hint`);
    if( settings.hints && !game.hinted ){ h.classList = `hint`; }
    else if( settings.hints ){ h.classList = `hint spent`; }
    else{ h.classList = `hint unshown`; }
}

function doHint(){
    let succ = false;
    for( k in hintKeys ){
        if( game.keys[hintKeys[k]].guessed ){}
        else if( game.keys[hintKeys[k]].inWord ){
            game.keys[hintKeys[k]].guessed = true;
            blinkKey( hintKeys[k] );
            succ = true;
            break;
        }
    }
    if( !succ ){ // must have guessed them all already
        let arr = game.word.split(``);
        for( a in arr ){ blinkKey( arr[a] ); }
    }
    game.hinted = true;
    updateHintState();
}

function blinkKey( k ){
    let target = document.querySelector(`[key="${k}"]` );
    target.classList.add( `blink` );
    setTimeout(() => {
        let b = document.querySelectorAll(`.blink`);
        for( let i = 0; i < b.length; i++ ){ b[i].classList.remove(`blink`); }
        updateKeyboard();
    }, 1450 );
}

function adjustModalBottom(){
    let target = document.querySelector(`.modalBottom`);    
    if( document.getElementById(`welcome`).classList.contains(`unshown`) ){
        target.innerHTML = `<div class="button">Again?</div>`;
    }
}

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
    let colLookup = { right: `#279277`, rightand: `#279277`, wrong: `#b39037`, wrongand: `#b39037`, locked: `#444` }
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
    localStorage.setItem( `settings` , JSON.stringify( settings ) );
}

function hardReset(){
    localStorage.clear();
    location.reload();
}

function loadGame(){
    if( JSON.parse( localStorage.getItem( `stats` ) ) !== null ){
        stats = JSON.parse( localStorage.getItem( `stats` ) );
    };
    if( stats.guesses !== undefined ){
        let temp = JSON.parse( JSON.stringify( stats ) );
        stats = {
            diff4: { guesses: 0, lost: 0, won: [0,0,0,0,0], notWord: 0 }
            , diff5: { guesses: temp.guess, lost: temp.lost, won: temp.won, notWord: 0 }
            , diff6: {guesses: 0, lost: 0, won: [0,0,0,0,0,0,0], notWord: 0
            }
        }
    }
    if( stats.diff5.guesses > 0 ){ toggleModal(); }
    for( let i = 0; i < 6; i++ ){
        if( stats.diff5.won[i] == undefined ){ stats.diff5.won[i] = 0; }
        if( isNaN( stats.diff5.won[i] ) ){ stats.diff5.won[i] = 0; }
    }
    if( JSON.parse( localStorage.getItem( `settings` ) ) !== null ){
        settings = JSON.parse( localStorage.getItem( `settings` ) );
    };
    if( settings.difficulty == undefined || settings.difficulty == false ){ settings.difficulty = 5; }
    else( game.diff = settings.difficulty );
}