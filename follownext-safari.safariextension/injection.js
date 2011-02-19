var FNInjection = (function() {

    return {

        patterns: {},

        init: function() {
            if (window !== window.top) return;

            safari.self.addEventListener('message', function(msg) {
                FNInjection[msg.name](msg.message);
            }, false);

            safari.self.tab.dispatchMessage('initConfig');

            (function($) {
                $.xpath = function(exp, ctxt) {
                    var item, coll = [];
                    var result = document.evaluate(exp, ctxt || document, function lookupNamespaceURI(prefix) {
                        return {
                            xhtml: 'http://www.w3.org/1999/xhtml',
                            xhtml2: 'http://www.w3.org/2002/06/xhtml2'
                        }[prefix] || null;
                    }, 5, null);

                    while (item = result.iterateNext()) {
                        coll.push($(item));
                    }

                    return $(coll);
                };
            })(jQuery);
        },

        findLink: function (rel) {
            var inj = this;
            var regexes = [];
            var patterns = this.patterns[rel].split(',');

            $.each(patterns, function(i, pattern) {
                regexes.push(new RegExp(pattern, 'i'));
            });

            function followFrame(frame) {

                function getLinks($elems) {
                    return $elems.filter(function() {
                        var $e = $(this);
                        return ($e.attr('rel').toLowerCase() == rel || $e.attr('rev').toLowerCase() == rel);
                    });
                }

                // <link>s have priority
                var $links = getLinks($('link', frame.document));

                $.each($links, function(i, e) {
                    inj.openLink($(e).attr('href'));
                    return true;
                });


                // Try anchors
                $links = getLinks($('a', frame.document));
                $.each($links, function(i, e) {
                    inj.followLink($(e));
                    return true;
                });

                var hint = "//*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or @class='lk' or @role='link'] | //input[not(@type='hidden')] | //a | //area | //iframe | //textarea | //button | //select | //xhtml:input[not(@type='hidden')] | //xhtml:a | //xhtml:area | //xhtml:iframe | //xhtml:textarea | //xhtml:button | //xhtml:select";
                var $x = $.xpath(hint, frame.document);
                var r = false;

                $.each(regexes, function(i, regex) {
                    $x.each(function(i, $e) {
                        if (regex.test($e.text()) || regex.test($e.attr('title')) || regex.test($e.attr('id'))) {
                            inj.followLink($e);
                            r = true;
                            return false;
                        }
                    });

                    if (r) {
                        return false;
                    }
                });

                return r;
            }

            var ret = followFrame(window);
            if (!ret) {
                inj.alert('Nothing found to follow!');
                // TODO: Loop through frames if content didn't match
            }
        },

        followLink: function ($elem) {
            $elem.focus();
            var inj = this;
            $.each(['mousedown', 'mouseup', 'click'], function (i, event) {
                inj.triggerEvent($elem[0], event);
            });
        },

        openLink: function (link) {
            document.location.href = link;
        },

        triggerEvent: function (elem, event) {
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent(event, true, true);
            elem.dispatchEvent(evt);
        },

        alert: function(message) {

            if (window !== window.top || !$('body').length) {
                return;
            }

            $('body').append(
                $('<ttn/>').append($('<ttn_inner/>').text(message)).attr('id', '_fn').css({
                    '-webkit-transition' : 'none',
                    'opacity'            : 1.0,
                    'display'            : 'block'
                })
            ).find('#_fn').fadeOut(1500, function() {
                $(this).remove();
            });
        },

        handleKey: function(e) {
            var code = { 37: 'previous', 39: 'next' };
            if (code.hasOwnProperty(e.keyCode) && e.ctrlKey) {
                this.findLink(code[e.keyCode]);
            }
        },

        configCallback: function(data) {
            this.patterns = { next : data['next'], previous : data['previous'] };
            this.setUpEventsAndElements.apply(this);
        },

        setUpEventsAndElements: function() {
            $(window).bind('keydown', function(e) {
                FNInjection.handleKey(e);
            });
        }
    };

})();

if (document.readyState == 'complete')
    FNInjection.init();
else window.addEventListener('load', function() {
    FNInjection.init();
});

