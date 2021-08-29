var libgsl = function() {
    var self = this;

    this.lang='ru'; //default language
    if(typeof(forced.lang)!=='undefined')
        this.lang=forced.lang;

    this.clang = function(title) {
        return (typeof(title)=='string') ? title : title[self.lang];
    }

    this.domain = forced.domain;

    this.slideshow = function(selector) {
        var wrapper = selector ? $(selector) : $('.slides-wrapper');
        if (wrapper.length > 0 && typeof($.rsfSlideshow) != "undefined") { // if exist wrapper and slideshow plugin loaded
            var slides = wrapper.find('ol.slides li a:not([href=""])');
            if(slides.length) {
                wrapper.rsfSlideshow().bind('rsImageReady', function(e, obj) { //autoinit
                    $('#alt_title').text(obj.slide.caption).fadeIn('slow');
                });
            }
        }
    }

    this.is_from_gsl = function () {
        fetch('/wp-content/themes/gsl/is_from_gsl_endpoint.php')
            .then(function(data) {
                data.text().then(function(is_from_gsl) {
                    if (is_from_gsl == 1) {
                        if (!document.body.classList.contains('logged-in')) {
                            let login_html = document.getElementById('login_url');
                            login_html.style.display = "inline";
                        }
                    }
                });
            })
            .catch(function(error) {
                console.log(error);
            });
    }

    this.gallery = function(selector) {
        selector= (!selector) ? $('.gallery') : $(selector).find('.gallery');

        if(!$.colorbox || selector.length<1) return; //load if colorbox loaded || any gallery container exist

        var is_light=false
        if($('.glight').length) { //check for yet one white gallery
            $('body').addClass('glight');
            is_light=true;
        }

        selector.each(function(i) {
            var id = $(this).attr('id') || 'gallery-'+i,
                sCurrent = $(this).prev().find('.gr-text').text() || $('h1 .gr-text').text() || false,
                sType = 'text';

            if($(this).hasClass('presentation')) sType = 'presentation';
            else if($(this).hasClass('photos')) sType = 'photos';
            else if($(this).hasClass('video')) sType = 'video';
            sCurrent = !sCurrent || '<h2><span class="icon '+sType+'"></span>'+sCurrent+'</h2>'

            var cOptions = {
                rel: id,
                maxWidth: '95%',
                maxHeight: '95%',
                photo: true,
                loop: false,
                initialWidth: 0,
                initialHeight: 0,
                current: sCurrent,
                fixed: true
            }
            if(is_light) { $.extend(cOptions, {onComplete: glight}) } //light gallery
            $(this).find('A.preview').colorbox(cOptions).find('img').removeClass('hide').lazyload(); //init colorbox

            $('#cboxCurrent').click(function() {$.colorbox.close()});

            if($(this).find('.more-preview').length)
                updateMoreLink(this);
        });

        function glight() {
            var jNext = $(this).next(':not(div)').length ? $(this).next(':not(div)') : $(this).next().find('A:first');
            var jPrev = $(this).prev().length ? $(this).prev() : $(this).parent().prev();

            $('#cboxNext').html(drawPaginator(jNext));
            $('#cboxPrevious').html(drawPaginator(jPrev));
        }

        function drawPaginator(el) {
            var css = {width: 57, height: 75, left:0, top: -20};
            var img=el.find('img');
            if(img.width() > img.height())
                css = {width: 75, height: 57, left:-7, top: -15};
            return el.clone().find('img').css(css).load(function() {$(this).lazyload()});
        }

        function updateMoreLink(container) {
            var jVisible = $(container).find('img:not(.hidden-preview img)'),
                jHidden = $(container).find('.hidden-preview'),
                jMore = $(container).find('.more-preview'),
                sizeMore = 0,
                delay = 50, //in miliseconds
                sizeVisible = jVisible.length,
                sizeHidden = jHidden.find('img').length;

            update();
            jMore.find('a').click(function() {
                jMore.hide();
                showHiddenPreview();
                return false;
            });

            function update() {
                if (sizeHidden > sizeVisible) {
                    sizeMore = sizeVisible;
                    if(location.href.indexOf("photo-of-the-day")!=-1) //hack for photo-of-the-day
                        sizeMore=18;
                }
                else {
                    sizeMore = sizeHidden;
                    jMore.find('sup').css('visibility', 'hidden');
                }
                if(sizeMore>0) {
                    jMore.removeClass('hide').show();
                    jMore.find('span.more').text(sizeMore);
                    jMore.find('span.total').text(sizeHidden);
                }
                else
                    jMore.hide();
            }

            function showHiddenPreview() {
                for(var i=0;i<sizeMore;i++) {
                    setTimeout(insertBefore, i*delay);
                    sizeHidden--;
                    sizeVisible++;
                }
                setTimeout(update, sizeMore*delay-delay);
            }

            function insertBefore() {
                jHidden.children('.preview:first').insertBefore(jHidden).lazyload();
            }
        }
    }

    this.priceCut = function(number) { //money cutting
        if(typeof(number) !== 'undefined') //param exists
            return number.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 '); //return
        else { //with no params
            $(".price-cut").each(function(i){
                var str = $(this).text();
                if (str=='БЕСПЛАТНО') $(this).css("color","#7c01bc");
                if (str.replace(' ','')!='') {
                    str = str.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
                    $(this).text(str);
                }
            });
        }
    };

    var popups=[]; //for unique popup forms
    this.colorbox = function(selector) {
        if(!selector)
            selector=$('.colorbox, .colorform');
        else {
            selector=$(selector);
            show_popup($, selector, true);
            if(is_unique(selector) && selector.is('form'))
                form_init(selector);
            return;
        }
        if(!$.colorbox || selector.length<1) return; //load if colorbox loaded || any selector exist

        selector.each(function(i) {
            var popup=find_popup($(this));
            if($(this).is('form')) //inline form
                form_init($(this), popup);
            if(popup && !$(this).is('form')) {
                show_popup($(this), popup, false);
                if(is_unique(popup))
                    form_init(popup);
            }
        });

        function find_popup(selector) {
            var ids=selector.attr('class').split(' ');
            for(var c=0; c<ids.length; c++) {
                var m = ids[c].match(/^cb_(.+)$/);
                if(m)
                    return $('#'+m[0]+'_popup');
            }
            return false;
        }

        function is_unique(popup) {
            popup=popup.attr('id');
            if($.inArray(popup, popups)==-1) {
                popups.push(popup);
                return true;
            }
            return false;
        }

        function show_popup(selector, popup, open) {
            var cOptions = {
                inline: true,
                href: popup,
                initialWidth: 0,
                initialHeight: 0,
                fixed: true
            }
            if(open)
                $.extend(cOptions, {open: true});
            selector.colorbox(cOptions);
        }

        function form_init(form, popup) {
            find_vpid(form);

            form.validationEngine('attach', { //start validation
                scroll: false,
                promptPosition: 'centerRight',
                autoPositionUpdate: true,
                focusFirstField: false,
                binded: false,
                autoHidePrompt: true,
                autoHideDelay: 1200
            });

            form.find('input, textarea').keydown(function(e) { //submit on ctrl+enter
                form.validationEngine('hide');
                if(e.ctrlKey && e.keyCode == 13)
                    form.submit();
            });

            form.submit(function(event) {
                var form_action=form.attr('action');
                if(/ajax/.test(form_action)) {
                    event.preventDefault();
                    var submit = form.find('input[type=submit]');
                    var ajax_action = form.find('input[name=action]').val();
                    if(!form.validationEngine('validate') || ajax_action=='undefined') return false; //if form not valid or !ajax_action do not submit

                    var show_error_msg = function() {
                        $.colorbox({html: 'Some error happened!<br/>Please try again!'});
                    };

                    var show_success_msg = function(response) {
                        if (response.success === true) { //should be sent by wp_send_json_success()
                            if (popup) {
                                var form_name = form.find('input[name=name]');
                                var popup_name = popup.find('.name_from_form');
                                if (form_name != 'undefined' && popup_name != 'undefined') popup_name.text(form_name.val()); //dear name from submitted form
                                show_popup($, popup, true);
                            }
                            else
                                $.colorbox.close();

                            form[0].reset();
                            find_vpid(form); //set again for IE
                        }
                        else
                            show_error_msg();
                    };

                    var ajax_options = {
                        url: form_action,
                        type: 'POST',
                        data: {
                            action: ajax_action,
                            ajaxdata: form.serialize()
                        },
                        success: show_success_msg,
                        timeout: 5000, //in ms
                        error: show_error_msg,
                        beforeSend: function() {
                            //submit.disable();
                        },
                        complete: function() {
                            //submit.enable();
                        }
                    };

                    if (form.find('input[type=file]').length > 0) { //если есть файл, отправим с помощью jquery.form
                        $.getScript('/wp-content/themes/gsl/js/jquery.form.js', function () {
                            form.ajaxSubmit(ajax_options);
                        });
                    }
                    else
                        $.ajax(ajax_options);

                    return false;
                }
            });
        }

        function find_vpid(form) {
            var vpid=form.find('input[name=vpid]');
            var dvpid=vpid.val();
            if(typeof(window[dvpid])!=='undefined')
                vpid.val(window[dvpid].fid);
        }
    }

    this.number_ending = function(iResultsNum, nouns) { //now only russian language
        if(!$.isArray(nouns) && nouns.length!=3) return; //nouns should be array(3)

        var iNounForm = 2;
        if(iResultsNum % 100 > 10 && iResultsNum % 100 < 20)
            iNounForm = 2;
        else {
            var iLastDigit = iResultsNum - (Math.floor(iResultsNum / 10) * 10);
            if(iLastDigit == 1)
                iNounForm = 0;
            else if(iLastDigit > 1 && iLastDigit < 5)
                iNounForm = 1;
            else
                iNounForm = 2;
        }
        return nouns[iNounForm];
    }

    this.paginator = function() {
        var blocks=$('.pager.content-navigation .nav-item');
        var pages=blocks.length;
        var selected=1;
        for(i=1; i<=pages; i++) {
            if($(blocks[i-1]).is('.selected'))
                selected=i;
        }
        if(selected!=pages)
            $("head").append('<link rel="next" href="'+paginator.page_url+'page/'+(selected+1)+'/" />');
        if(selected==2)
            $("head").append('<link rel="prev" href="'+paginator.page_url+'" />');
        else if(selected>2)
            $("head").append('<link rel="prev" href="'+paginator.page_url+'page/'+(selected-1)+'/" />');
    }

    this.videos = function() {
        var mejs_options = window.mejs_options || {};
    }

    this.expander = function(id) {
        function Expander(jContainer) {
            var
                jExpander = jContainer.find('.expand-hidden, .expand-visible').eq(0),
                jControls = jContainer.next('.expander').eq(0),
                jParentIncut = jContainer.parents('.expanding-incut');

            /* перехват событий */
            jControls.find('.less, .more, .toggle').click(toggle);

            /* методы */
            function expand() {
                jControls.removeClass('more').addClass('less');
                if (jParentIncut.length) jParentIncut.addClass('expanded-incut');
                jExpander.slideDown(function(){
                    jExpander.removeClass('expand-hidden').addClass('expand-visible');
                })
            }

            function collapse() {
                jControls.removeClass('less').addClass('more');
                if (jParentIncut.length) jParentIncut.removeClass('expanded-incut');
                jExpander.slideUp(function(){
                    jExpander.removeClass('expand-visible').addClass('expand-hidden')
                });
            }

            function toggle() {
                if (jExpander.hasClass('expand-hidden')) expand();
                else collapse();
            }
        }

        function ExpandDetails(jContainer) {
            var
                jControls = jContainer.find('.show-details, .hide-details'),
                jDetails = jContainer.next('.event-description, .tags, .expand_table'),
                sDetailsHeight = (jDetails.hasClass('with-shadow'))? '9.2em' : 'auto';
            //sPaddingBottom = (jDetails.hasClass('tags'))? 20 : 0;

            jDetails = (jDetails.length) ? jDetails : jContainer.parents('.main-wide').next('.event-description, .tags, .expand_table');
            jDetails = (jDetails.length) ? jDetails : jContainer.next("table, .next-expand").next(".expand_table"); //single-bank

            /* перехват событий */
            jContainer.not(':has(a:not(.more a))') //without any links (excluding admin links .more A)
                .click(toggle)
                .hover(function() {
                    $(this).css({cursor: 'pointer'});
                })
            jControls.click(function(e) {
                e.stopPropagation(); //disable parent jContainer.click
                toggle();
            });

            /* методы */
            function toggle() {
                if (jControls.hasClass('show-details'))
                    expand();
                else
                    collapse();
                if (window.expandAllSwitch)
                    window.expandAllSwitch.refresh();
            }

            function expand() {
                jControls.removeClass('show-details').addClass('hide-details');
                jDetails.each(function(index) {
                    //$("#footer").hide();
                    $(this).slideDown(function() {
                        gsl.gallery(this);
                        $(this).removeClass('expand-hidden');
                    });
                });
            }

            function collapse() {
                jControls.removeClass('hide-details').addClass('show-details');
                jDetails.each(function(index) {
                    $(this).slideUp(function() {
                        $(this).addClass('expand-hidden');
                    });
                });
            }
        }

        var selector = id || document;

        $(selector).find('h2, h3, h4').filter('.event-title:has(.show-details, .hide-details)').each(function() {
            new ExpandDetails($(this));
        });

        $(selector).find('.expline .expline_control').click(function() {
            $(this).closest('.expline').toggleClass('expanded_line');
            if(typeof(window.table_hover)!=='undefined' && $(this).parents('tr').length>0)
                window.table_hover.over($(this).parents('tr'));
        });

        if(!id) {
            $('.tag-switch .tags-container span.tag_expander').each(function() {
                new ExpandDetails($(this));
            });

            $('.expand-container').each(function(){
                new Expander($(this));
            });

            $('.all-details').click(function() { // expand all
                var parent = $(this).parents(".panel-item");
                if ($(this).hasClass('show-all')) {
                    $(this).removeClass('show-all').addClass('hide-all');
                    if (parent.size()>0) parent.find('.show-details').filter(function(index){ return !($(this).parents('.tag-switch').length) }).trigger('click')
                    else $('.show-details').filter(function(index){ return !($(this).parents('.tag-switch').length) }).trigger('click')
                } else {
                    $(this).removeClass('hide-all').addClass('show-all');
                    if (parent.size()>0) parent.find('.hide-details').filter(function(index){ return !($(this).parents('.tag-switch').length) }).trigger('click')
                    else $('.hide-details').filter(function(index){ return !($(this).parents('.tag-switch').length) }).trigger('click')
                }
            })

            $('.content-container').each(function() { // content-tabs
                var jaNavItems = $(this).find('.content-navigation .nav-item');
                var jaContentBlocks = $(this).find('.content-block');
                if(jaContentBlocks.length == 0) //in single jurs
                    jaContentBlocks = $('.panel-item');

                jaNavItems.find('label').click(function() {
                    var jCurrentNavItem = $(this).parents('.nav-item'); //current
                    if (!jCurrentNavItem.hasClass('selected')) {
                        $(jaNavItems, this).removeClass('selected');
                        jCurrentNavItem.addClass('selected');
                    }

                    jaContentBlocks.hide();
                    var hash = $(this).attr('for');
                    $('#'+hash).show();
                    window.location.hash = '#show-' + hash; // add special hash to url
                    $('A#pdfmyurl').attr('href', 'https://pdfmyurl.com?url=' + encodeURIComponent(window.location.href)); //update pdfmyurl link
                });
            });
            var hash = window.location.hash.replace('#show-', '');
            //$('label[for=' + hash + ']').trigger('click'); //open div with current hash


            $('label.expand').click(function() { // incut-definition expander
                $('#' + $(this).attr('for')).toggleClass('hidden');
                //gsl.gradient();
            });

            $('label.slide').click(function() {
                $('#' + $(this).attr('for')).slideToggle('slow');
            });

            $('#header #site_switcher, #header #site_switcher .reducer a').click(function(evt) {
                function closeSiteSwithcer() { // sites menu
                    $('#header  #site_switcher').removeClass('open');
                    $(document).unbind('click', closeSiteSwithcer);
                }

                if (this.tagName == 'A') {
                    evt.preventDefault();
                }
                if (evt.target.tagName != 'A') {
                    evt.stopPropagation();
                }
                if (!$('#header  #site_switcher').hasClass('open')) {
                    $('#header #site_switcher').addClass('open');
                    $(document).click(closeSiteSwithcer);
                } else if (this.tagName == 'A') {
                    closeSiteSwithcer();
                }
            });
        }
    }

    this.ads = function() {
        $('.adsbygoogle').each(function(){
            (adsbygoogle = window.adsbygoogle || []).push({});
        });
    }

    this.popupHandle = function() {
        var popup, label = '.pseudo-popup-handler label';
        $('body').on('mouseenter, click', label, function() {
            popup = $('#' + $(this).attr('for'));
            var os = $(this).offset();
            popup.show().css('top', os.top + 45).css('left', os.left - 40);

        });
        $('body').on('mouseleave', label, function() {
            popup.hide();
        });
    }

    this.redconnectClosedTitles =  {
        ru: 'Заказать звонок возможно с 9.00 до 21.00 UTC+3',
        en: 'Its possible to order a call from 9.00 to 21.00 UTC + 3',
        cn: 'Its possible to order a call from 9.00 to 21.00 UTC + 3'
    }

    this.videochatClosedTitles =  {
        ru: 'Начать видеоконсультацию возможно с 12.00 до 00.00 UTC+3',
        en: 'Its possible to start video chat from 12.00 to 00.00 UTC + 3',
        cn: 'Its possible to start video chat from 12.00 to 00.00 UTC + 3'
    }

    //videochat с 12 до 00 часов, redconnect с 9 до 21 часа
    this.calculateContactMethodAссess = function (open_hour, close_hour, selector, message) {
        let now_time = new Date().toLocaleString("en-US", {timeZone: 'Europe/Moscow'});
        now_time = new Date(now_time);
        let open_time = new Date().toLocaleString("en-US", {timeZone: 'Europe/Moscow'});
        open_time = new Date(open_time);
        open_time.setHours(open_hour,0,0,0);
        let closed_time = new Date().toLocaleString("en-US", {timeZone: 'Europe/Moscow'});
        closed_time = new Date(closed_time);
        closed_time.setHours(close_hour,0,0,0);

        if( now_time < open_time || now_time >= closed_time ) {
            let link_videochat = document.querySelector(selector);
            link_videochat.classList.add('contacts-link_disabled');
            link_videochat.setAttribute('data-tooltip', message);
        }
    }
}

var gsl = new libgsl();
gsl.is_from_gsl();
//videochat с 12 до 00 часов, redconnect с 9 до 21 часа
gsl.calculateContactMethodAссess(12, 24, '.link-videoconference', gsl.clang(gsl.videochatClosedTitles));
gsl.calculateContactMethodAссess(9, 21, '.link-redconnect', gsl.clang(gsl.redconnectClosedTitles));
var gsl_player;
var seminar_mute = true;
var jivo_onLoadCallback = function() {
    jivo_api.open();
};
var jivo_onClose = function() {
    $('#gsl_contacts_container').removeClass('gsl-contacts-container_hidden');
};
$(function() {
    gsl.gallery();
    gsl.colorbox();
    gsl.priceCut();
    gsl_player = gsl.videos();
    gsl.slideshow();
    gsl.expander();
    gsl.ads();
    gsl.popupHandle();

    $('.contacts-link_disabled').on('click', function(e) {
        e.stopImmediatePropagation();
        return false;
    });
    if(window.paginator && paginator.page_url) //from wp_localize_script()
        gsl.paginator();
    $(document).bind({ //globally add noscolling body on colorbox
        'cbox_load': function() { $('body, html').css({overflow: 'hidden'}) },
        'cbox_complete': function() { $('#cboxLoadedContent').find('input, textarea').filter(':visible').eq(0).focus() }, //focus first input on popup
        'cbox_cleanup': function() { $('body, html').css({overflow: 'visible'}) }
    });
    if(forced.nocopy) {
        function addLink() {
            var body_element = document.getElementsByTagName('body')[0];
            var selection;
            selection = window.getSelection();
            var pagelink = '<br /><br /> подробнее на сайте <a href="'+document.location.href+'" >'+document.location.href+'</a><br />'; // change this if you want
            var copytext = selection + pagelink;
            var newdiv = document.createElement('div');
            newdiv.style.position='absolute';
            newdiv.style.left='-99999px';
            body_element.appendChild(newdiv);
            newdiv.innerHTML = copytext;
            selection.selectAllChildren(newdiv);
            window.setTimeout(function() {
                body_element.removeChild(newdiv);
            },0);
        }
        document.addEventListener('copy', addLink);
    }
    $('.offshore-switcher__checkbox').on('change', function () {
        $(this).closest('.sub-menu').toggleClass( 'highlight-offshore', this.checked );
    });
    $('.openwin').click(function() {
        var features, w = 1000, h = 600;
        var top = (screen.height - h)/2
        var left = (screen.width - w)/2;
        if(top < 0)
            top = 0;
        if(left < 0)
            left = 0;
        features = 'top=' + top + ',left=' + left + ',height=' + h + ',width=' + w + ',resizable=1,menubar=0,toolbar=0,directories=0,status=0,scrollbars=1';
        window.open($(this).attr('href'), null, features);
        return false;
    });
    $('.link-jivosite').on('click', function(e) {
        e.preventDefault();
        if (typeof jivo_api !== 'undefined') {
            $('#gsl_contacts_container').addClass('gsl-contacts-container_hidden');
            jivo_api.open();
            return;
        }
        var $chat_lang = $('#chat_languages');
        var $this = $(this);
        $chat_lang.toggleClass('chat-languages__visible');
        $this.toggleClass('unhover');
        if ($chat_lang.hasClass('chat-languages__visible')) {
            $('body').one('click', function(evt) {
                $chat_lang.removeClass('chat-languages__visible');
                $this.removeClass('unhover');
            });
        }
        e.stopPropagation();
    });

    $('.chat-languages__lang').on('click', function(e) {
        e.preventDefault();
        $('#gsl_contacts_container').addClass('gsl-contacts-container_hidden');
        if (typeof jivo_api !== 'undefined') {
            jivo_api.open();
        } else {
            let script_name = $(this).hasClass('chat-languages__lang-ru') ? '96Ya98iyY8' : '2mIClHODYD';
            let s = document.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.src = '//code.jivosite.com/script/geo-widget/'+script_name;
            let ss = document.getElementsByTagName('script')[0];
            ss.parentNode.insertBefore(s, ss);
        }
    })

    $('.link-redconnect').on('click', function(e){
        console.log('redconnect');
        e.preventDefault();
        $('.gsl-contacts-container').trigger('mouseleave').addClass('gsl-contacts-container_hidden');
        if ($("#rc-phone").length > 0) {
            let $rc_phone = $('#rc-phone');
            $rc_phone.addClass('rc-show');
            $rc_phone.click();
        } else {
            var body = document.querySelector("body");
            var ob = new MutationObserver(function (mutations) {
                if (body.classList.contains('redhlp_ready')) {
                    let $rc_phone = $('#rc-phone');
                    $rc_phone.addClass('rc-show');
                    $rc_phone.click();
                    $('#rc-phone-form-close, #rc-popup-close').on("click", function () {
                        $('#rc-phone').removeClass('rc-show');
                        $('.gsl-contacts-container').removeClass('gsl-contacts-container_hidden');
                    });
                    ob.disconnect();
                }
            });
            ob.observe(body, {
                attributes: true,
                attributeFilter: ["class"]
            });
            let redconnect_script = document.createElement('script');
            redconnect_script.type = 'text/javascript';
            redconnect_script.src = 'https://web.redhelper.ru/service/main.js?c=ypryakhin';
            redconnect_script.setAttribute("id", "rhlpscrtg");
            redconnect_script.setAttribute("charset", "utf-8");
            document.body.appendChild(redconnect_script);
        }
    });
    $('a[rel~="external"]').click(function(e) { //open external link in new window
        e.preventDefault();
        window.open(this.href);
    });

    $('.swing A').click(function(e) { //vote button
        e.preventDefault();
        var id = $(this).attr('rel');
        var dir = $(this).hasClass("contra") ? '-1' : '1' ;

        var like_box = $('#like_box_popup')
        if (dir == 1 && like_box.length) {
            $('body').addClass('glight'); // Делаем light галерею
            gsl.colorbox(like_box);  // show like box
            $('.close_cform').click(function() {
                $.colorbox.close();
                return false;
            });
            $(document).bind('cbox_closed', function() {
                $('body').removeClass('glight');
            });
        }

        $.get('/'+gsl.lang+'/wp-admin/admin-ajax.php?action=do_vote', { ID: id, DIR: dir }, function(data) {
            $('#vote_div').html(data);
        });
    });

    $('.printit').click(function() {
        window.print(); //print current page
    });

    $(".show-more-objects").click(function() {
        $(this).closest( "h2" ).nextAll('div, ul').eq(0).find('.hidden-more-objects').show();
    });

    $( '.go_to_address' ).each(function( i ) {
        $( this ).wrap( '<a href="' + $(this).data('link') + '"></a>' );
    });
    $('.offer_to_pdf').click(function(e){
        e.preventDefault();
        var pid = $(this).data('post_id');
        $('#form-download').remove();
        $('body').prepend('<form enctype="multipart/form-data" action="/'+gsl.lang+'/wp-admin/admin-ajax.php" id="form-download" method="post" style="display: none;">' +
            ' <input type="hidden" name="action" value="offer_pdf"><input type="hidden" name="post_id" value="' + pid +'"><input id="download'+pid+'" type="submit">');
        $('#download'+pid).trigger('click');
    });

    // Клик по Email

    $('a[href=\'mailto:gsl@gsl.org\']').on('click contextmenu copy',  null, null, function() {
        console.log('email_select');
        gtag('event', 'selectEmail', { 'event_category': 'select', 'event_action': 'email_select'});
        yaCounter8462590.reachGoal('email_select'); return true;

    }, false);

    // Клик по Телефон

    $('a[href^=\'tel\']').on('click contextmenu copy',  null, null, function() {
        console.log('tel_select');
        gtag('event', 'selectTel', { 'event_category': 'select', 'event_action': 'tel_select'});
        yaCounter8462590.reachGoal('tel_select'); return true;

    }, false);


    // Клик по Skype

    $('a[href^=\'skype\']').on('click contextmenu copy',  null, null, function() {
        console.log('skype');
        gtag('event', 'skype', { 'event_category': 'click', 'event_action': 'skype'});
        yaCounter8462590.reachGoal('skype'); return true;

    }, false);

    // Клик по Whatsapp

    $("a[href^='https://wa.me']").on('click contextmenu copy',  null, null, function() {
        console.log('whatsapp');
        gtag('event', 'whatsapp', { 'event_category': 'click', 'event_action': 'whatsapp'});
        yaCounter8462590.reachGoal('whatsapp'); return true;

    }, false);

    // Клик по Telegram

    $("a[href^='https://t.me']").on('click contextmenu copy',  null, null, function() {
        console.log('telegram');
        gtag('event', 'telegram', { 'event_category': 'click', 'event_action': 'telegram'});
        yaCounter8462590.reachGoal('telegram'); return true;

    }, false);

    // Клик по Viber

    $('a[href^=\'viber\']').on('click contextmenu copy',  null, null, function() {
        console.log('viber');
        gtag('event', 'viber', { 'event_category': 'click', 'event_action': 'viber'});
        yaCounter8462590.reachGoal('viber'); return true;

    }, false);

    // Клик по Chat

    $('.chat-submit').on('click',  null, null, function() {
        console.log('chat_submit');
        gtag('event', 'chat_submit', { 'event_category': 'submit', 'event_action': 'chat_submit'});
        yaCounter8462590.reachGoal('chat_submit'); return true;

    }, false);

    // feedback (клик и успешная отправка)

    $('.slide.pseudo-link, .cb_msg').on('click',  null, null, function() {
        console.log('feedback');
        gtag('event', 'clickFeedback', { 'event_category': 'click', 'event_action': 'feedback'});
        yaCounter8462590.reachGoal('feedback'); return true;

    }, false);
    $(document).on('click','.feedback_form_submit',function(){
        console.log('feedback_submit');
        gtag('event', 'clickFeedback', { 'event_category': 'submit', 'event_action': 'feedback_submit'});
        yaCounter8462590.reachGoal('feedback_submit'); return true;

    });

    // callback (клик и успешная отправка)

    $('.consultation_form_link, a.cta-button.callback').on('click',  null, null, function() {
        console.log('callback');
        gtag('event', 'clickCallback', { 'event_category': 'click', 'event_action': 'callback'});
        yaCounter8462590.reachGoal('callback'); return true;

    }, false);

    // Клик по видеоконференции

    $('.link-videoconference').on('click',  null, null, function() {
        console.log('videoconference');
        gtag('event', 'click_videoconference', { 'event_category': 'click', 'event_action': 'videoconference'});
        yaCounter8462590.reachGoal('click_videoconference'); return true;

    }, false);

    $(document).on('click','.consultation_form_submit',function(){
        console.log('callback_submit');
        gtag('event', 'clickCallback', { 'event_category': 'submit', 'event_action': 'callback_submit'});
        yaCounter8462590.reachGoal('callback_submit'); return true;

    });

    $(document).on('click','.tarif_form_submit',function(){
        console.log('tariff_submit');
        gtag('event', 'clickCallback', { 'event_category': 'submit', 'event_action': 'tariff_submit'});
        yaCounter8462590.reachGoal('tariff_submit'); return true;

    });

    $(document).on('click','.dots',function(){
        var more = $(this).data('more');
        $('#more'+ more).slideToggle();
        $(this).toggleClass('active');
        if ($(this).hasClass('active')) {
            $(this + '.sign-container').html('<span class="hide-details-o"></span>');
        } else {
            $(this + '.sign-container').html('...<span class="show-details-o"></span>');
        }
    });

    $('.footer-subscriptions .colorform').on('submit', function (e) {
        e.preventDefault();
        if ($(this).validationEngine('validate')) {
            let $container = $('.footer-subscriptions');
            let $loader = $('#ajax_loader');
            let mail = $(this).find('#id_email').val();
            let link = $(this).attr('action');
            $(this).fadeOut(200, function () {
                $loader.show();
            });
            $.ajax({
                method: 'POST',
                url: link,
                data: {email:mail,custom_ajax:1}
            })
                .done(function( response ) {
                    $container.append(response);
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    $container.append('<p>Something went wrong, try again.</p>');
                })
                .always(function() {
                    $loader.hide();
                });
        }
    });
    $('.subscriptions-email').on( "focusin", function() {
        $(this).parent().addClass('in-focus');
    });
    $('.subscriptions-email').on( "focusout", function() {
        $(this).parent().removeClass('in-focus');
    });
    $('.footer_main-block #site_switcher .reducer a').on('click', function(e) {
        e.preventDefault();
        $('.footer_main-block .switcher>div').toggleClass('open');
    });
    $('body').on('click', '[data-id]', function(){
        var id = $(this).attr('data-id');
        var offset = $('#'+id).offset();
        var to = offset.top-130;
        $("html, body").animate({scrollTop: to+"px"});
        return false;
    });

    $('body').on('click', '.ui-scrolltab_nav .action', function(){
        var $scrollarea = $(this).parent('div').parent('div').children('.ui--scrolltab_wrapper');
        var current_position = $scrollarea.scrollLeft();
        var scroll_size = $scrollarea.children(':first-child').width();

        if($(this).hasClass('left')){
            $scrollarea.animate({
                scrollLeft: current_position-scroll_size
            }, 150);
        }

        if($(this).hasClass('right')){
            $scrollarea.animate({
                scrollLeft: current_position+scroll_size
            }, 150);
        }
    });

    var randomProperty = function (obj) {
        var keys = Object.keys(obj);
        return obj[keys[ keys.length * Math.random() << 0]];
    };

    function put_offers(){
        var $block = false;
        var $banners = '';
        if(Object.keys(banners).length >= 1){
            $('.main-inner .layout--a').each(function(index, value){
                if(index == 1){
                    $block = $(this);
                }
            });
            $.each(banners, function(index, banner){
                $banners = $banners+get_banner_template(banner);
            });
            if ($block != false)
                $block.after('<div class="l-content--a l-fw-500 l-pb-10 l-pt-10 l-mt-25">Все услуги по этой теме:</div><div class="l-content--a l-pt-10 l-pb-20"><div class="ui--scrolltab_block"><div class="ui--scrolltab_wrapper">'+$banners+'</div><div class="ui-scrolltab_nav"><div class="action left"><span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg></span></div><div class="action right"><span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg></span></div></div></div></div>');
        }
    }
    function init_banners(){
        var i = 4;
        var used = [];
        if(Object.keys(banners).length >= 1){
            $('.main-inner .layout--a').each(function(index, value){
                var banner = randomProperty(banners);
                if(typeof banner.title !== 'undefined'){
                    if(index == i){
                        if($.inArray(banner.title, used) === -1){
                            if($(this).find('h3, h2, h1, h4').length != 0){
                                $(this).before('<div class="layout--a layout--propaganda">'+get_banner_template(banner)+'</div>');
                            } else {
                                $(this).after('<div class="layout--a layout--propaganda">'+get_banner_template(banner)+'</div>');
                            }
                            used.push(banner.title);
                            i+=4;
                        }
                    }
                }
            });
        }

    }

    function get_banner_template(banner){
        if(banner.type == 'form'){
            var template = '<div class="ui-form-banner '+banner.style.theme+'"><div class="ui-form-banner-wrapper"><div class="ui-form-calback"><div class="l-fs-20 l-fw-500 l-mb-10" id="title">'+banner.title+'</div><div class="l-mb-10" id="text">'+banner.text+'</div><div id="callback-form" type="form" class="l-clear"><div class="ui-input-1"><input type="text" id="name" inputmode="name"><label for="name">Имя</label><div class="validation">Некорректные данные</div></div><div class="ui-input-1"><input type="text" id="phone" inputmode="phone"><label for="phone">Телефон</label><div class="validation">Некорректные данные</div></div><div class="ui-input-1 m-mb-10"><input type="text" inputmode="email" id="email"><label for="email">E-mail</label><div class="validation">Некорректные данные</div></div><div class="ui-input-1"><textarea id="message" class="isnt_empty mb-30"></textarea><label for="message">Ваш вопрос (не обязательно)</label></div><input type="hidden" name="goal" id="goal" value="konsult_onlain"><button type="submit" class="l-mb-25 l-mt-20 l-w-full ui-button ui-button--1 ui-button--large ui-button--tw"  id="button-text">'+banner.button_text+'</button><p class="l-fs-13">Нажимая кнопку «'+banner.button_text+'», Вы соглашаетесь на обработку <span class="br"></span>персональных данных в соответствии с условиями <span class="br"></span><a href="https://gsl.org/ru/privacy/" target="_blank">политики конфиденциальности</a></p><p class="l-fs-13 l-mb-11 l-mt-25 l-pt-15 l-ta-center ui-border--top" style=" border-color: #00000012;">или напишите нам в мессенджере</p><div class="ui-messengers-block"><a href="skype://gsl.moscow.1?chat" target="_blank"><i class="fab fa-skype"></i></a> <a href="https://t.me/get_offshore_bot" target="_blank"><i class="fab fa-telegram-plane"></i></a> <a href="https://wa.me/74993725115" target="_blank"><i class="fab fa-whatsapp"></i></a> <a href="viber://pa?chatURI=offshoremixer" target="_blank"><i class="fab fa-viber"></i></a></div></div></div></div></div>';
        } else {
            var template = '<div class="ui-form-banner '+banner.style.theme+'"><div class="ui-form-banner-wrapper"><div class="ui-form-calback"><a class="l-fs-20 l-fw-500 l-mb-10 l-block" id="title" onclick="ym(65284740,\'reachGoal\',\''+banner.goal+'\');"  href="'+banner.url+'" target="_blank">'+banner.title+'</a><div class="l-mb-15 l-mt-5" id="text">'+banner.text+'</div><div type="url" class="l-clear"><a class="l-mt-20 l-float-left ui-button ui-button--2 ui-button--with-icon" href="'+banner.url+'" onclick="ym(65284740,\'reachGoal\',\''+banner.goal+'\');" target="_blank"><span class="l-mr-10">'+banner.button_text+'</span> <span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg></span></a></div></div></div></div>';
        }

        return template;
    }

    $('body').on('click', '[data-details]', function(){
        var text = $(this).attr('data-details');
        if(text != ''){
            alert(text);
        }
        return false;
    });

    function init_header_list(){
        var h2_index = 1;
        var h3_index = 1;
        var h4_index = 1;
        $('.layout--a h2, .layout--a h3, .layout--a h4').each(function(index, value){
            index = index-1;
            if($(this).text() != 'Содержание'){
                if(this.tagName == 'H4'){
                    var get_h2_index = h2_index-1;
                    var get_h3_index = h3_index-1;
                    $(this).after('<h4 id="h'+get_h2_index+'_'+get_h3_index+'_'+h4_index+'">'+ $(this).html()+'</h4>');
                    h4_index = h4_index+1;
                    $(this).remove();
                } else if(this.tagName == 'H3'){
                    var get_h2_index = h2_index-1;
                    h4_index = 1;
                    $(this).after('<h3 id="h'+get_h2_index+'_'+h3_index+'">'+ $(this).html()+'</h3>');
                    h3_index = h3_index+1;
                    $(this).remove();
                } else if(this.tagName == 'H2'){
                    h3_index = 1;
                    $(this).after('<h2 id="h'+h2_index+'">'+ $(this).html()+'</h2>');
                    h2_index = h2_index+1;
                    $(this).remove();
                }

            }
        });
    }
    if (forced.lang == 'ru' ) {
        setTimeout(function(){
            init_banners();
            put_offers();
        }, 2000);
        init_header_list();
    }
});

