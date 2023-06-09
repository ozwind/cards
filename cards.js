const suits = ['C','S','H','D'];  // https://acbl.mybigcommerce.com/52-playing-cards/
const kinds = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const margins = ['Auto','0%','5%','10%','15%','20%','25%','30%'];
const BG_STORE = "userBG";
const DECK_STORE = "userDeck";
const WINS_STORE = "userWins";
const MARGIN_STORE = "userMargin";
const AUDIO_STORE = "userAudio";
let currentDeck = 0;
let currentBG = 'Default';
let currentMargin = 0;
let currentAudio = 0;
let cards = [];
let undos = [];
var clickTimer;
let origPos;
let isUndoClicked = false;
let fins = {};  // Finish arguments

// pool:   24
// stacks: 1 + 2 + 3 + 4 + 5 + 6 + 7 = 28

function init() {
    for (idxKind in kinds) {
        for (idxSuit in suits) {
            cards.push(kinds[idxKind] + suits[idxSuit]);
        }
    }

    showSave(false);
    showUndo(false);
    showFinish(false);
    showStop(false);
    showRemaining();

    $("#pool").on('click', function(evt) {
        clickPool();
    });

    $("#unpool").on('click', function(evt) {
        if (clickTimer) {
            clearTimeout(clickTimer);  // this is double click
            clickTimer = null;
        }
        else {
            clickTimer = setTimeout(function() {
                clickTimer = null;     // this is single click
                clickUnpool();
            }, 400);
        }
    });

    $("#remain").on('click', function(evt) {
        clickPool();
    });

    $(window).resize(function() {
        resize();
    });

    $("#deal").on('click', function() {
        randomize(cards);
        deal();
    });

    $("#save").on('click', function() {
        save();
    });

    $("#load").on('click', function() {
        loadFile();
    });

    $("#reset").on('click', function() {
        location.reload();
    });

    $("#settings").on('click', function() {
        showOptionsDialog();
    });

    $("#finish").on('click', function(event) {
        event.stopPropagation();
        finish();
    });

    $("#stop").on('click', function() {
        stopAnimation();
    });

    $("#undo").on('click', function() {
        undo();
    });

    $(document).on('click', function() {
        stopAnimation();
    });

    $(document).on('keydown', function() {
        stopAnimation();
    });

    initOptions();
    adjustMargins();
    showWins();
}

function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

function save() {
    saveCards().then(() => {
        console.log('File saved successfully!');
    }).catch((error) => {
        console.log(error.stack);
    });
}

async function saveCards() {
    const filename = getCurrentDateTime() + ".json";
    const handle = await showSaveFilePicker({
        suggestedName: filename,
        types: [{
            description: 'JSON file',
            accept: {'text/plain': ['.json']},
        }],
    });

    const json = JSON.stringify(cards);
    const blob = new Blob([json]);

    const writableStream = await handle.createWritable();
    await writableStream.write(blob);
    await writableStream.close();
}

function loadFile() {
    var input = $('<input>').attr('type', 'file');  // Create an input element of type "file"

    input.on('change', function (event) { // Listen for the "change" event on the input element
        var file = event.target.files[0]; // Get the selected file
        var reader = new FileReader();
        var filename = file.name;

        reader.onload = function (e) {
            var fileText = e.target.result;
            try {
                cards = JSON.parse(fileText);
                deal();
                showSave(false);
                document.title = filename;
            }
            catch (error) {
                alert(error);
            }
        };

        reader.readAsText(file);
    });

    input.trigger('click'); // Trigger a click event on the input element
}

function resize() {
    adjustMargins();
    adjustOffsets();
    showBackground();
    showRemaining();
    $('#dlgOptions').dialog('close');    
}

function getWins() {
    let wins = localStorage.getItem(WINS_STORE);
    return wins ? Number(wins) : 0;
}

function storeWins(wins) {
    localStorage.setItem(WINS_STORE, wins);
}

function showWins() {
    let wins = getWins();
    $("#winsVal").text(wins);
}

function showBackground(name) {
    const bg = name ? name : currentBG;
    const bgKey = bgMap.get(bg) ? bg : 'Default';
    const $body = $("body");
    const bkgdSize = window.innerWidth + "px " + window.innerHeight + "px";

    $body.css("background-image", "url(" + bgMap.get(bgKey) + ")");
    $body.css("background-size", bkgdSize);
}

function showDeck(index) {
    const idx = (index || (index >= 0 && index < decks.length)) ? index : currentDeck;
    const $cards = $('[card]');

    for (var i = 0; i < $cards.length; i++) {
        const $card = $($cards[i]);
        let src = $card.attr("src");
        if (src.endsWith("_back.jpg")) {
            setCard($card, decks[idx].image);
        }
    }
}

function showOptionsDialog() {
    $('#bgSel').val(currentBG);
    $('#deckSel').val(currentDeck);
    $('#marginSel').val(currentMargin);
    $('#audioSel').val(currentAudio);
    showDlgOptions(true);
    $('#dlgOptions').dialog('open');
}

function initOptions() {
    const $dlg = $('#dlgOptions');
    const usrBG = localStorage.getItem(BG_STORE);
    const usrDeck = Number(localStorage.getItem(DECK_STORE));
    const usrMargin = Number(localStorage.getItem(MARGIN_STORE));
    const usrAudio = Number(localStorage.getItem(AUDIO_STORE));
    var $div;
    var $lbl;
    var $sel;

    currentBG = bgMap.get(usrBG) ? usrBG : 'Default';
    currentDeck = (usrDeck >= 0 && usrDeck < decks.length) ? usrDeck : 0;
    currentMargin = (usrMargin >= 0 && usrMargin < margins.length) ? usrMargin : 0;
    currentAudio = (usrAudio >= 0 && usrAudio < 2) ? usrAudio : 0;
    showBackground();
    showDlgOptions(false);

    // Init background choices picklist
    $div = $('<div class="dlgRow"></div>');
    $lbl = $('<div>Background:</div>');
    $sel = $('<select id="bgSel">');
    for (var i = 0; i < backgrounds.length; i++) {
        let bg = backgrounds[i];
        let $option = $('<option value="' + bg.name + '">' + bg.name + '</option>');
        $sel.append($option);
    }
    $sel.val(currentBG);
    $div.append($lbl);
    $div.append($sel);
    $dlg.append($div);
    $sel.change(function() {
        showBackground($(this).val());
    });

    // Init deck choices
    $div = $('<div class="dlgRow"></div>');
    $lbl = $('<div>Deck style:</div>');
    $sel = $('<select id="deckSel">');
    for (var i = 0; i < decks.length; i++) {
        let deck = decks[i];
        let $option = $('<option value="' + i + '">' + deck.name + '</option>');
        $sel.append($option);
    }
    $sel.val(currentDeck);
    $div.append($lbl);
    $div.append($sel);
    $dlg.append($div);
    $sel.change(function() {
        showDeck(Number($(this).val()));
    });

    // Init margin choices
    $div = $('<div class="dlgRow"></div>');
    $lbl = $('<div>Side margins:</div>');
    $sel = $('<select id="marginSel">');
    for (var i = 0; i < margins.length; i++) {
        let margin = margins[i];
        let $option = $('<option value="' + i + '">' + margin + '</option>');
        $sel.append($option);
    }
    $sel.val(currentMargin);
    $div.append($lbl);
    $div.append($sel);
    $dlg.append($div);
    $sel.change(function() {
        adjustMargins(Number($(this).val()));
        $dlg.dialog("option", "position", { my: "center", at: "center", of: window });
    });

    // Init audio choices
    $div = $('<div class="dlgRow"></div>');
    $lbl = $('<div>Audio:</div>');
    $sel = $('<select id="audioSel">');
    let $opt = $('<option value="0">Enable</option>');
    $sel.append($opt);
    $opt = $('<option value="1">Disable</option>');
    $sel.append($opt);
    $sel.val(currentAudio);
    $div.append($lbl);
    $div.append($sel);
    $dlg.append($div);

    $dlg.dialog({
        autoOpen: false, // Dialog won't open automatically on page load
        modal: true, // Enable modal behavior
        buttons: {
            Ok: function() {
                currentBG = $('#bgSel').val();
                localStorage.setItem(BG_STORE, currentBG);
                currentDeck = Number($('#deckSel').val());
                localStorage.setItem(DECK_STORE, currentDeck);
                currentMargin = Number($('#marginSel').val());
                localStorage.setItem(MARGIN_STORE, currentMargin);
                currentAudio = Number($('#audioSel').val());
                localStorage.setItem(AUDIO_STORE, currentAudio);
                showDlgOptions(false);
                $(this).dialog('close');
            },
            Cancel: function() {
                showBackground();
                showDeck();
                adjustMargins();
                showDlgOptions(false);
                $(this).dialog('close');
            }
        }
    });
}

// Adjust so that cards fit without vertical scrolling
function adjustMargins(index) {
    const idx = (index || (index >= 0 && index < margins.length)) ? index : currentMargin;
    const $body = $("body");
    var margin;
    let suffix = "%";

    if (idx == 0) {     // auto
        const dWidth = window.innerWidth;
        const dHeight = window.innerHeight;
        margin = dHeight > dWidth ? 0 : 27 * (dWidth - dHeight) / dHeight;
        if (margin > 30) {
            margin = 30;
        }
    }
    else {
        margin = margins[idx].slice(0, -1);  // removes last character %
    }

    if (margin < 1) {
        margin = 5;
        suffix = "px";
    }

    $body.css("margin-left", margin + suffix);
    $body.css("margin-right", margin + suffix);
    adjustOffsets();
    showRemaining();
}

function adjustOffsets() {
    let $bots = $('#botRow .imgContainer');

    for (var i = 0; i < $bots.length; i++) {
        adjustOffset($($bots[i]));
    }
}

function adjustOffset($ic) {
    const allowOffset = $ic.closest("#topRow").length == 0;

    // Clean out any multiDrags:
    let $mds = $ic.find('#multiDrag');
    for (var i = 0; i < $mds.length; i++) {
        let $md = $($mds[i]);
        let $imgs = $md.find('img');
        for (var j = 0; j < $imgs.length; j++) {
            $ic.append($imgs[j]);
        }
        $md.remove();
    }

    let top = 0;
    let offset = allowOffset ? $("#pool").height() / 6 : 0;
    let $images = $ic.find('img');
    for (var j = 1; j < $images.length; j++) {
        let $img = $($images[j]);
        $img.css('top', top + 'px');
        $img.removeClass('dragHover');  // in case drag/drop does not remove
        top += offset;
    }

    let $imgs = $('body img');
    let $ics = $('body .imgContainer');

    for (var i = 0; i < $imgs.length; i++) {
        let $img = $($imgs[i]);
        clearDrag($img);
        clearDrop($img);
    }
    for (var i = 0; i < $ics.length; i++) {
        let $ic = $($ics[i]);
        clearDrag($ic);
        clearDrop($ic);
    }
}

function destroyDragDrop($sel) {
    clearDrag($sel);
    clearDrop($sel);
}

function clearDrop($sel) {
    if ($sel.data("ui-droppable")) {
        $sel.droppable("destroy");
    }
    if ($sel.hasClass('ui-droppable-handle')) {
        $sel.removeClass("ui-droppable-handle");
    }
    if ($sel.hasClass('ui-droppable')) {
        $sel.removeClass("ui-droppable");
    }
}

function clearDrag($sel) {
    if ($sel.data("ui-draggable")) {
        $sel.draggable("destroy");
    }
    if ($sel.hasClass('ui-draggable-handle')) {
        $sel.removeClass("ui-draggable-handle");
    }
    if ($sel.hasClass('ui-draggable')) {
        $sel.removeClass("ui-draggable");
    }
}

function clearTopDrop() {
    for (var i = 0; i < 4; i++) {
        const $stack = $("#stack" + i);
        clearDrop($stack);
        const $imgs = $stack.find("img");
        for (var j = 0; j < $imgs.length; j++) {
            clearDrop($($imgs[j]));
        }
    }
}

function setCard($sel, card, initEvent) {  // Sets card image
    let src = "images/" + card + ".jpg";
    $sel.attr("src", src);

    if (initEvent) {
        $sel.mouseover(function(evt) {
            if (evt.buttons == 0) {
                mouseover(this);
            }
        });

        $sel.on('dblclick', function(evt) {
            doubleClick(this);
        });
    }
}

function doubleClick(self) {
    let $this = $(self);
    let $moveTo = undefined;

    if (!showingBack(self) && $this.closest('#multiDrag').length < 1) {
        let card = getCardType($this);

        for (var i = 0; i < 4; i++) {
            const $stack = $("#stack" + i);
            const $last = $stack.find(":last");
            const topCard = getCardType($last);

            if (topCard) {
                if (card.suit === topCard.suit && card.val == (topCard.val + 1)) {
                    $moveTo = $stack;  // legal move
                    break;
                }
            }
            else if ('A' === card.kind) {
                $moveTo = $stack;       // legal move
                break;
            }
        }
    }

    if ($moveTo) {
        dropProcess($this, $moveTo);
        checkButtons();
        $this.css('top', '0px');
    }
}

function getTop($elem) {
    let top = $elem.css('top');
    if (top && top.endsWith('px')) {
        return Number(top.slice(0, -2)); // return top value, without ending 'px'
    }
    return 0;
}

function mouseover(self) {
    let $this = $(self);
    multiDragDone($this);
    if (!showingBack(self)) {
        let $topRow = $this.closest("#topRow");
        let $parent = $this.parent();
        let $all = $this.nextAll();
        if ($all.length > 0 && $topRow.length < 1) {
            let offset = $("#pool").height() / 6;
            let $div = $('<div id="multiDrag"></div>');
            clearDrag($this);
            clearTopDrop();
            let dTop = getTop($this);
            $div.css('top', dTop + 'px');
            $this.css('top', '0px');
            $div.append($this);
            let top = 0;
            for (var i = 0; i < $all.length; i++) {
                $img = $($all[i]);
                top += offset;
                $img.css('top', top + 'px');
                clearDrag($img);
                $div.append($img);
            }
            $parent.append($div);
            setDraggable($div);
        }
        else {
            setDraggable($this);
        }
    }
    setDroppables($this);
}

function multiDragDone($this) {
    let $ic = $this.closest('.imgContainer');
    adjustOffset($ic);
}

function resetPool() {
    let index = 0;
    let max = 24;
    let $pool = $('#pool');
    $('#pool img:not(:first)').remove();
    while (index < max) {
        const card = cards[index++];
        const $img = $("<img>");
        $pool.append($img);
        $img.attr("card", card);
        setCard($img, decks[currentDeck].image, true);
    }

    $('#unpool').empty();

    return index;
}

function randomize(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }    
}

function placeCards() {
    let index = resetPool();

    let $bots = $('#botRow .imgContainer');

    for (var i = 0; i < $bots.length; i++) {
        let $bot = $($bots[i]);
        let len = i + 1;
        $bot.find(" :first-child").attr("title", "King goes here");
        $bot.find("img:not(.holder)").remove();
        for (var j = 0; j < len; j++) {
            const card = cards[index++];
            let showBack = j < (len - 1);
            let $img = $("<img>");
            $bot.append($img);
            $img.attr("card", card);
            setCard($img, showBack ? decks[currentDeck].image : card, true);
        }
    }

    adjustOffsets();

    $('#pool').addClass('clickable');
}

function clickPool() {
    const $pool = $("#pool");
    const $unpool = $('#unpool');

    if ($pool.hasClass('clickable')) {
        const $target = $pool.find(':last-child');
        const len = $pool.children().length;
        const card = getCard($target);

        if (len > 0 && !$target.hasClass('holder')) {
            $unpool.append($target);
            setCard($target, card);
            setDraggable($target);
        }
        else if ($unpool.children().length > 0) {
            const $images = $unpool.find("img");
            for (var i = $images.length - 1; i >= 0; i--) {
                const $img = $($images[i]);
                $pool.append($img);
                setCard($img, decks[currentDeck].image);
            }
        }
        else {
            $pool.removeClass('clickable');
        }

        showRemaining();
    }
}

function clickUnpool() {
    const $last = $("#unpool :last-child");

    if ($last.length > 0) {
        clearDrag($last);
        setCard($last, decks[currentDeck].image);
        $last.addClass('clickable');
        $("#pool").append($last);
        showRemaining();
    }
}

// Make image draggable
function setDraggable($img) {
    $img.draggable({
        start: function() {
            if ("multiDrag" == this.id || !showingBack(this)) {
                $(this).css("z-index", 9999);
                origPos = $(this).position();                
            }
        },
        cursor: 'move',
        scroll: false,
        revert: function(dropped) {
            if (!dropped) {
                $(this).animate({ top: origPos.top, left: origPos.left }, 200)
                    .promise().done(function() {
                        const $this = $(this);
                        const id = $this.parent()[0].id;
                        $this.css("z-index", "auto");
                        if (id && id.startsWith('stack')) {
                            $this.css("top", 0);
                        }
                });
            }
        }
    });    
}

function setDroppables($img) {
    if (showingBack($img[0])) {
        return;
    }

    const type = getCardType($img);

    // Handle the four upper stacks:
    if ("multiDrag" != $img.parent()[0].id) {
        for (var i = 0; i < 4; i++) {
            const $stack = $("#stack" + i);
            const sType = getCardType($stack.find(":last")); // stack card showing
            let allowDrop = false;
            if (sType) {
                if (type.suit === sType.suit && (type.val === (sType.val + 1))) {
                    allowDrop = true;  // Next in sequence, and same suit
                }
                else if (type.suit === sType.suit && type.val === sType.val) {
                    allowDrop = true;  // Same card, allow drop back in place
                }
            }
            else if ('A' === type.kind) {  // Ace
                allowDrop = true;
            }

            if (allowDrop) {
                clearDrop($stack);
                let $last = $stack.find(":last");
                $last.droppable({
                    hoverClass: 'dragHover',
                    drop: function(event, ui) {
                        dropTop(event, ui)
                    }
                });
            }
            else {
                destroyDragDrop($stack);
                let $images = $stack.find('img');
                for (var j = 0; j < $images.length; j++) {
                    destroyDragDrop($($images[j]));
                }
            }
        }
    }

    // Handle the bottom stacks:
    const $bots = $('#botRow .imgContainer');
    const parent = $img.parent()[0];
    const isStack = parent.id && parent.id.includes('stack');

    for (var i = 0; i < $bots.length; i++) {
        let $bot = $($bots[i]);
        let $last = $bot.find(":last");
        let sType = getCardType($last); // stack card showing
        let allowDrop = false;

        if (sType) {
            if (sType.val === (type.val + 1) && sType.isRed != type.isRed) {
                allowDrop = true;
            }
        }
        else if ('K' === type.kind && !isStack) {  // King
            allowDrop = true;
        }

        clearDrop($last);

        if (allowDrop) {
            $last.droppable({
                hoverClass: 'dragHover',
                drop: function(event, ui) {
                    dropBot(event, ui)
                }
            });            
        }
    }
}

function getCard($img) {
    return $img.attr('card');
}

function getCardType($img) {
    const card = getCard($img);

    if (card) {                       // i.e. KH, 10D, 9C
        let suit = card.slice(-1);    // C, S, H, D
        let kind = card.slice(0, -1); // A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
        let isRed = suit === 'H' || suit === 'D';
        let val = 0;
        switch (kind) {
            case 'A': val = 1; break;
            case 'J': val = 11; break;
            case 'Q': val = 12; break;
            case 'K': val = 13; break;
            default:  val = Number(kind); break;
        }
        return {kind, suit, val, isRed};
    }
}

function deal() {
    document.title = "Cards";
    showSave(true);
    showUndo(false);
    showFinish(false);
    showStop(false);
    placeCards();
    showRemaining();
    undos = [];

    for (var i = 0; i < 4; i++) {
        let stack = "#stack" + i;
        $(stack + " :not(:first)").remove();
        $(stack + " :first-child").attr("title", "Ace goes here");
    }
}

function showRemaining() {
    const count = $('#pool img:not(:first)').length;
    const $remain = $('#remain');
    let text = "";

    if (count == 1) {
        text = "1 card";
    }
    else if (count > 1) {
        text = count + " cards";
    }
    $remain.text(text);

    const $pool = $('#pool');
    const offset = $pool.offset();
    const textWidth = $remain[0].offsetWidth;
    const poolWidth = $pool.width();
    const poolHeight = $pool.height();
    const xPos = offset.left + (poolWidth - textWidth) / 2;
    const yPos = offset.top - 9 + poolHeight / 2;

    $remain.css('left', xPos);
    $remain.css('top', yPos);
}

function dropProcess($src, $dest) {
    $src.css('z-index', 'unset');     // source img
    $src.css('left', 'unset');
    $src.css('top', 'unset');
    const $prev = $src.prev();        // $prev is the img just before source img
    let prevBack = false;

    if ($prev.length > 0 && !$prev.hasClass('holder')) {
        prevBack = showingBack($prev[0]);
        const card = getCard($prev);
        setCard($prev, card);
        setDraggable($prev);           // make the previous img draggable
    }

    // Handle undo:
    let cards = [];
    let card = getCard($src);
    if (card) {
        cards.push(card);
    }
    else {
        const $imgs = $src.find('img');
        for (var i = 0; i < $imgs.length; i++) {
            card = getCard($($imgs[i]));
            cards.push(card);
        }
    }    
    undos.push({cards, prevBack, src: $src.parent()});

    if ($dest[0].id && $dest[0].id.startsWith('stack')) {
        $src.css('top', '0');
    }

    $dest.append($src);                 // move ui.draggable to destination imgContainer
    checkButtons();                     // determine visible state of buttons
}

function dropTop(event, ui) {
    const $target = $(event.target);    // $target is destination img
    const $parent = $target.parent();   // $parent is the destination imgContainer
    dropProcess(ui.draggable, $parent); // ui.draggable is source img
}

function dropBot(event, ui) {
    const $target = $(event.target);    // $target is destination img
    const $parent = $target.parent();   // $parent is the destination imgContainer
    dropProcess(ui.draggable, $parent); // ui.draggable is source img
    multiDragDone($target);             // prevents drag/drop, until the next mouseover
    adjustOffsets();                    // neatly stack cards in the 7 columns
}

function showElem(id, show) {
    const $button = $('#' + id);

    if (show) {
        $button.removeClass('hidden');
    }
    else {
        $button.addClass('hidden');
    }
}

function showSave(show) {
    showElem('save', show);
}

function showUndo(show) {
    showElem('undo', show);
}

function showFinish(show) {
    showElem('finish', show);
}

function showStop(show) {
    showElem('stop', show);
}

function showDlgOptions(show) {
    showElem('dlgOptions', show)
}

function checkButtons() {
    const $cards = $('#botRow [card]');
    let show = true;

    for (var i = 0; i < $cards.length; i++) {
        if (showingBack($cards[i])) {
            show = false;
            break;
        }
    }

    showFinish(show);
    showUndo(!show && undos.length > 0);
    showRemaining();
}

function showingBack(elem) {
    return elem.src && elem.src.includes(decks[currentDeck].image);
}

function undo() {
    if (isUndoClicked) {
        return;  // prevent Undo button from being clicked quickly
    }

    isUndoClicked = true;

    const $undo = $('#undo');
    let entry = undos.pop();
    let cards = entry.cards;
    let $src = entry.src;

    $undo.addClass('disabled');

    if (entry.prevBack) {
        let $last = $src.find(":last");
        setCard($last, decks[currentDeck].image);
    }

    for (var i = 0; i < cards.length; i++) {
        let $card = $('[card="' + cards[i] + '"]');
        $src.append($card);

        $card.css('top', '0px');
    }

    adjustOffsets();
    checkButtons();

    setTimeout(function() {
        isUndoClicked = false;
        $undo.removeClass('disabled');
    }, 500);
}

function finish() {
    let cards = [];
    const $imgs = $('[card]');
    const wins = getWins() + 1;

    storeWins(wins);             // Increase total user wins
    showWins();
    showFinish(false);

    for (var i = 0; i < $imgs.length; i++) {
        const $img = $($imgs[i]);
        const id = $img.parent()[0].id;

        if (!id || !id.startsWith('stack')) {
            let card = $img.attr('card');
            cards.push(card);
        }
    }

    fins.mp3 = playMp3();        // Play a random audio clip
    fins.cards = cards;
    showStop(true);

    animate(cards);   // Move/rotate cards to the suit stacks
}

function stopAnimation() {
    if (fins.mp3 && fins.cards) {
        fins.mp3.pause();
        fins.cards.splice(0, fins.cards.length);   // empty cards array
        delete fins.mp3;
    }
    if (fins.$spiral) {
        fins.$spiral.remove();
    }

    showStop(false);
}

// Select an mp3 that is not the same as the previous
function playMp3() {
    const MAX = 7;
    const LAST_MP3_STORE = "lastMp3";
    let indexes = [];

    for (var i = 0; i < MAX; i++) {
        indexes.push(i);
    }

    randomize(indexes);
    randomize(indexes);

    let last = localStorage.getItem(LAST_MP3_STORE);

    if (!last || last < 0 || last >= MAX) {
        last = 0;
    }

    const idx = (last == indexes[0]) ? indexes[1] : indexes[0];

    localStorage.setItem(LAST_MP3_STORE, idx);

    const audio = new Audio('sounds/win' + idx + '.mp3');
    if (currentAudio == 0) {  // audio enabled
        audio.play();
    }

    return audio;
}

function nextSuit() {
    let availSuits = Array.from(suits);

    for (var i = 0; i < 4; i++) {
        let $stack = $('#stack' + i);
        let $last = $stack.find(":last");
        let type = getCardType($last);
        if (type) {
            let idx = availSuits.indexOf(type.suit);
            availSuits.splice(idx, 1);
        }
    }

    if (availSuits.length > 0) {
        return availSuits[0];
    }
}

function animate(cards) {
    var $stack;
    var idxCard;
    let stacks = [0, 1, 2, 3];

    randomize(stacks);

    for (var i = 0; i < stacks.length; i++) {
        let $stk = $('#stack' + stacks[i]);
        let $last = $stk.find(":last");
        let type = getCardType($last);
        let idxNext = type ? kinds.indexOf(type.kind) + 1 : 0;
        let suit = type ? type.suit : nextSuit();

        if (suit && idxNext < kinds.length) {
            let nextCard = kinds[idxNext] + suit;
            idxCard = cards.indexOf(nextCard);
            if (idxCard >= 0) {
                $stack = $stk;
                break;
            }
        }
    }

    if ($stack) {
        let card = cards[idxCard];
        let $img = $('[card="' + card + '"]');
        cards.splice(idxCard, 1);
        let pos = $stack.offset();
        let iPos = $img.offset();
        let left = pos.left - iPos.left;
        let top = pos.top - iPos.top + getTop($img);
        setCard($img, card);
        $img.css('z-index', 999);

        // Move and rotate card
        $img.animate(
            { deg:360, top: top, left: left },
            {
                duration: 300,
                step: function(now, fx) {
                    if (fx.prop === 'deg') {
                        $img.css({ transform: 'rotate(' + now + 'deg)' });
                    }
                    else {
                        $img.css(fx.prop, now);
                    }
                },
                complete: function() {
                    $stack.append($img);
                    $img.css('top', 'unset');
                    $img.css('left', 'unset');
                    $img.css('z-index', 'unset');
                    showRemaining();
                    adjustOffsets();
                    animate(cards);
                }
            }
        );
    }
    else {
        initSpiral();
    }
}

function initSpiral() {
    const $body = $("body");
    fins.$spiral = $('<canvas id="spiral">');
    const ctx = fins.$spiral[0].getContext("2d");
    const width = window.innerWidth;
    const height = window.innerHeight
    const xPos = 0;
    const yPos = 0;
    const cWidth = 150;
    const cHeight = cWidth * 1.528;
    const idx = 0;
    const sCards = ['KS','QH','JC','AD'];

    $body.append(fins.$spiral);
    fins.$spiral.attr('width', width);
    fins.$spiral.attr('height', height);
    ctx.translate(width / 2, height / 2);
    let sObj = {ctx, xPos, yPos, cWidth, cHeight, idx, sCards};
    spiral(sObj);
}

function spiral(sObj) {
    let img = new Image;
    img.onload = function() {
        const direction = (sObj.idx % 2) == 0 ? 1 : -1;
        sObj.ctx.drawImage(this, sObj.xPos++, sObj.yPos++, sObj.cWidth, sObj.cHeight);
        sObj.ctx.rotate((direction * 5 * Math.PI) / 180);
        if (sObj.xPos > window.innerWidth / 2 || sObj.yPos > window.innerHeight / 2) {
            sObj.ctx.rotate(0);
            sObj.xPos = 0;
            sObj.yPos = 0;
            sObj.idx++;
        }
        if (fins.mp3 && sObj.idx < sObj.sCards.length) {
            setTimeout(function() {
                spiral(sObj);
            }, 5);
        }
        else {
            showStop(false);
            fins.$spiral.remove();
        }
    };

    img.src = 'images/' + sObj.sCards[sObj.idx] + '.jpg';  // triggers img.onload
}
