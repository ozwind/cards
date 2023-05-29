const suits = ['C','S','H','D'];  // https://acbl.mybigcommerce.com/52-playing-cards/
const kinds = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const BACK = "blue_back";
let cards = [];
let index = 0;
let origPos;
let $multiDrag;
//let currentSuit = 0;
//let currentKind = 0;

// pool:   24
// stacks: 1 + 2 + 3 + 4 + 5 + 6 + 7 = 28

function init() {
    const $pool = $("#pool");

    for (idxKind in kinds) {
        for (idxSuit in suits) {
            cards.push(kinds[idxKind] + suits[idxSuit]);
        }
    }

    $("#finish").hide();

    $pool.on('click', function(evt) {
        clickPool(evt);
    });

    $(window).resize(function() {
        adjustOffsets();
    });

    $("#deal").on('click', function() {
        deal();
    });

    $("#reset").on('click', function() {
        location.reload();
    });

    $("#finish").on('click', function() {
        finish();
    });
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
    checkFinish();

    if (initEvent) {
        $sel.mouseover(function(evt) {
            if (evt.buttons == 0) {
                mouseover(this);
            }
        });
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
    if (!self.src.includes(BACK)) {
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
                //let top = getTop($img) - dTop;
                top += offset;
                $img.css('top', top + 'px');
                clearDrag($img);
                $div.append($img);
            }
            $multiDrag = $parent;
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
    index = 0;
    let max = 24;
    let $pool = $('#pool');
    $pool.empty();
    while (index < max) {
        const card = cards[index++];
        const $img = $("<img>");
        $pool.append($img);
        $img.attr("card", card);
        setCard($img, BACK, true);
    }

    $('#unpool').empty();
}

function shuffle() {
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    resetPool();

    let $bots = $('#botRow .imgContainer');

    for (var i = 0; i < $bots.length; i++) {
        let $bot = $($bots[i]);
        let len = i + 1;
        $bot.find("img:not(.spacer)").remove();
        for (var j = 0; j < len; j++) {
            const card = cards[index++];
            let showBack = j < (len - 1);
            let $img = $("<img>");
            $bot.append($img);
            $img.attr("card", card);
            setCard($img, showBack ? BACK : card, true);
        }
    }

    adjustOffsets();

    $('#pool').addClass('clickable');
}

function clickPool(evt) {
    const $pool = $("#pool");
    const $unpool = $('#unpool');

    if ($pool.hasClass('clickable')) {
        const $target = $(evt.target);
        const len = $pool.children().length;
        const card = getCard($target);

        if (len > 0) {
            $unpool.append($target);
            setCard($target, card);
            setDraggable($target);
        }
        else if ($unpool.children().length > 0) {
            const $images = $unpool.find("img");
            for (var i = $images.length - 1; i >= 0; i--) {
                const $img = $($images[i]);
                $pool.append($img);
                setCard($img, BACK);
            }
        }
        else {
            $pool.removeClass('clickable');
        }
    }
}

function clickUnpool() {
    const $unpool = $("#unpool");
    if ($unpool.parent().hasClass('clickable')) {
        while (unpool.length > 0) {
            const card = unpool.pop();
            pool.push(card);
        }
        $unpool.parent().removeClass('clickable');
        $unpool.parent().addClass('empty');
        $unpool.removeAttr('src');
        setPool(true);
    }
}

// Make image draggable
function setDraggable($img) {
    $img.draggable({
        start: function() {
            if ("multiDrag" == this.id || (this.src && !this.src.includes(BACK))) {
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
                        $(this).css("z-index", "auto");
                });
            }
        }
    });    
}

function setDroppables($img) {
    if ($img[0].src && $img[0].src.includes(BACK)) {
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
                $stack.droppable({
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
    $("#finish").hide();
    shuffle();

    for (var i = 0; i < 4; i++) {
        $("#stack" + i).empty();
    }
}

function dropProcess(ui) {    
    ui.draggable.css('z-index', 'unset');
    ui.draggable.css('left', 'unset');
    ui.draggable.css('top', 'unset');
    const $prev = ui.draggable.prev();
    if ($prev.length > 0 && !$prev.hasClass('spacer')) {
        const card = getCard($prev);
        setCard($prev, card);
        setDraggable($prev);
    }
}

function dropTop(event, ui) {
    const $target = $(event.target);
    dropProcess(ui);
    $target.append(ui.draggable);
    $target.css('top', '0px');
}

function dropBot(event, ui) {
    const $target = $(event.target).parent();
    dropProcess(ui);
    $target.append(ui.draggable);
    multiDragDone($(event.target));
    adjustOffsets();
}

function checkFinish() {
    const $cards = $('[card]');

    for (var i = 0; i < $cards.length; i++) {
        if ($cards[i].src.includes(BACK)) {
            return;
        }
    }

    $("#finish").show();
}

function finish() {
    let cards = [];
    const $imgs = $('[card]');

    for (var i = 0; i < $imgs.length; i++) {
        const $img = $($imgs[i]);
        const id = $img.parent()[0].id;

        if (!id || !id.startsWith('stack')) {
            let card = $img.attr('card');
            cards.push(card);
        }
    }

    animate(cards);
}

function animate(cards) {
    var $stack;
    var idxCard;

    for (var i = 0; i < 4; i++) {
        let $stk = $('#stack' + i);
        let $last = $stk.find(":last");
        let type = getCardType($last);

        if (type) {
            let idxNext = kinds.indexOf(type.kind) + 1;
            if (idxNext < kinds.length) {
                let nextCard = kinds[idxNext] + type.suit;
                idxCard = cards.indexOf(nextCard);
                if (idxCard >= 0) {
                    $stack = $stk;
                    break;
                }
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

        $img.animate({ top: top, left: left }, 400, function() {
            $stack.append($img);
            $img.css('top', 'unset');
            $img.css('left', 'unset');
            $img.css('z-index', 'unset');
            animate(cards);
        });
    }
}
