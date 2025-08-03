$(document).ready(function () {
    function showSiriMessage(msg) {
        const $siriMsg = $('.siri-message');
        if (msg === 'Listening...' || msg === 'Recognizing...') {
            $siriMsg.text(msg);
            $siriMsg.textillate({
                loop: true,
                minDisplayTime: 3000,
                sync: true,
                in: {
                    effect: "fadeInUp",
                    sync: true,
                },
                out: {
                    effect: "fadeOutUp",
                    sync: true,
                },
            });
            $siriMsg.show();
        } else {
            $siriMsg.text(msg);
            $siriMsg.textillate('stop');
            if (!msg) {
                $siriMsg.hide();
            } else {
                $siriMsg.show();
            }
        }
    }

    eel.expose(DisplayMessage);
    function DisplayMessage(msg) {
        showSiriMessage(msg);
    }

    eel.expose(ShowHood)
    function ShowHood() {
        $("#Oval").attr("hidden", false);
        $("#SiriWave").attr("hidden", true);
    }
});