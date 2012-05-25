module("uce.uceplayer", {
    teardown: function() {
        $('#jwplayer').uceplayer('destroy');
    }
});


test("create", function() {
    $('#jwplayer').uceplayer({
        uceclient: Factories.client,
        ucemeeting: Factories.meeting,
        id: "#mediaplayer"
    });
    // TODO tests inside elements
});

test("destroy", function() {
    $('#jwplayer').uceplayer();
    $('#jwplayer').uceplayer('destroy');
    equal($('#jwplayer > *').size(), 0);
});

module("uce.uceplayer", {
    setup: function() {
        var that = this;
        $('#jwplayer').uceplayer();
    },
    teardown: function() {
        $('#jwplayer').uceplayer('destroy');
    }});

test("play", function() {
    $('#jwplayer').uceplayer('play');
    //equals($("#jwplayer").children().size(), 0);
});
test("pause", function() {
    $('#jwplayer').uceplayer('pause');
});
test("stop", function() {
    $('#jwplayer').uceplayer('stop');
});
test("seek", function() {
    $('#jwplayer').uceplayer('seek', 10);
});
test("getDuration", function() {
    $('#jwplayer').uceplayer('seek', 10);
    $('#jwplayer').uceplayer('getDuration');
});
test("getCurrentTime", function() {
    $('#jwplayer').uceplayer('seek', 10);
    var t=$('#jwplayer').uceplayer('getCurrentTime');
});

