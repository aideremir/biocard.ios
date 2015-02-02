/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


var app = {
        apiURL: 'http://biocard.com/api/courierexe',
        orders: [],
        // Application Constructor
        init: function () {

            this.dragging = false;
            var _this = this;

            $("body").on("touchmove", function () {
                _this.dragging = true;
                //console.log($('.page').scrollTop())
            });
            $("body").on("touchstart", function () {
                _this.dragging = false;
            });

            this.spinner = $('#content .spinnerContainer');
            this.popup = $('#popup-container');
            this.extra = 13;

            this.orders = [];

            this.hide(this.popup);

            this.bindMenuEvents();
            this.bindButtonsEvents();
            this.bindLoginEvents();

            this.bindFormSubmissions();

            var $profileIcon = $('#header .profile');

            this.backButton = $('#header .back');
            this.backButton.on('touchend', function () {
                var goto = $(this).attr('goto');

                if (goto) {
                    _this.showPage(goto);
                }

            })


            if (!localStorage.getItem('login') || !localStorage.getItem('password')) {

                this.showPage('login');

                $profileIcon.hide();
            }
            else {
                this.login = localStorage.getItem('login');
                this.password = localStorage.getItem('password');

                this.showPage('trackingResultsList');

                $profileIcon.show();
            }


        },

        bindFormSubmissions: function () {

            var $profileDataForm = $('#profileDataForm'),
                _this = this;


            $profileDataForm.on('submit', function (e) {
                e.preventDefault();


                var $form = $(this);

                $form.find('input').each(function () {
                    var $input = $(this);

                    console.log($input.attr('id'));

                    localStorage.setItem($input.attr('id'), $input.val());
                    _this[$input.attr('id')] = localStorage.getItem($input.attr('id'));
                })

                return false;
            })

        },

        onShowPage: function (pageId) {
            var _this = this,
                $pageObj = $('#' + pageId),
                pageLevel = $pageObj.data('level');


            if (pageLevel > 1) {
                _this.backButton.attr('goto', _this.currentPage).show();
            }
            else {
                _this.backButton.hide();
            }

            _this.currentPage = pageId;


            switch (pageId) {
                case 'news':
                    _this.getNewsContent();
                    break;

                case 'profile':

                    $pageObj.find('.loginLabel').html(_this.login);

                    $pageObj.find('#profileDataForm input').each(function () {
                        var $input = $(this);

                        $input.val(localStorage.getItem($input.attr('id')));

                    })

                    $(document).on('touchend', '#logout', function (e) {

                        e.preventDefault();

                        var $profileIcon = $('#header .profile');


                        _this.login = null;
                        _this.password = null;

                        localStorage.removeItem('login');
                        localStorage.removeItem('password');

                        $profileIcon.hide();

                        _this.showPage('login');


                        return false;
                    })

                    break;
                case 'trackingResultsMap':

                    navigator.geolocation.getCurrentPosition(function (position) {
                        //console.log(position);

                        var lat = position.coords.latitude,
                            lon = position.coords.longitude,
                            latLon = new google.maps.LatLng(lat, lon),
                            bounds = new google.maps.LatLngBounds(latLon);

                        var options = {
                            center: latLon,
                            zoom: 16,
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        }

                        if(_this.map)
                        {
                            return false;
                        }


                        _this.map = new google.maps.Map(document.getElementById('googleMap'), options);

                        google.maps.event.addListenerOnce(_this.map, 'idle', function () {
                            //map loaded fully

                            myMarker = new google.maps.Marker({
                                position: latLon,
                                title: 'I am here',
                                map: _this.map,
                                icon: 'http://www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png',
                                draggable: false
                            }),


                            $.each(_this.orders, function (key, order) {
                                var orderLatLon = new google.maps.LatLng(order.lat, order.lon),

                                    orderMarker = new google.maps.Marker({
                                        position: orderLatLon,
                                        title: order.orderno,
                                        map: _this.map,
                                        //icon: 'http://www.google.com/mapfiles/marker' + markerSymbol + '.png',
                                        draggable: false
                                    }),
                                    /*
                                    infoCenter = new google.maps.InfoWindow({
                                        content: order.orderno
                                    }),
                                    */
                                    circle = new google.maps.Circle({
                                        map: _this.map,
                                        clickable: false,
                                        // metres
                                        radius: order.accuracy,
                                        fillColor: '#fff',
                                        fillOpacity: .6,
                                        strokeColor: '#313131',
                                        strokeOpacity: .4,
                                        strokeWeight: .8
                                    });

                                // attach circle to marker
                                circle.bindTo('center', orderMarker, 'position');

                                google.maps.event.addListener(orderMarker, 'click', order.onTouch);

                                bounds.extend(orderMarker.getPosition());

                            })

                            _this.map.fitBounds(bounds);

                        });


                    }, function (error) {
                        console.log(error);
                    })


                    break;

                case 'trackingResultsList':

                    var $searchResults = $('#trackingResultsList .wrap');

                    if ($searchResults.html() !== '') {
                        return false;
                    }

                    _this.loadOrders();


                    break;


                case 'order':
                    break;

            }

        },


        loadOrders: function () {

            var $searchResults = $('#trackingResultsList .wrap'),
                _this = this;

            var xml = '<?xml version="1.0" encoding="UTF-8" ?>' +
                '<statusreq>' +
                '<auth extra="' + _this.extra + '" login="' + _this.login + '" pass="' + _this.password + '"></auth>' +
                '<orderno></orderno>' +
                '<datefrom></datefrom>' +
                '<dateto></dateto>' +
                '<done>ONLY_NOT_DONE</done>' +
                '</statusreq>';

            _this.apiSend(xml, function (data) {
                //console.log(data);

                var count = $(data).find('statusreq').attr('count'),
                    $orders = $(data).find('order'),
                    $orderCard = $('#orderCard');

                if (count <= 0) {
                    _this.showPopup('No results');
                    return false;
                }

                $searchResults.html('');

                $orders.each(function () {
                    var $order = $(this),
                        order = {},
                        $orderItem = $('<div class="orderItem" data-orderno="' + $order.attr('orderno') + '"><span class="orderNo">' + $order.attr('orderno') + '</span>&nbsp;<span class="toCompany">' + $order.find('receiver company').text() + '</span><i class="fa fa-chevron-right"></i></div>');

                    var orderTouch = function () {
                        if (_this.dragging) {
                            return false;
                        }

                        $orderCard.find('h1').text($order.attr('orderno'));

                        var content = '<table>';

                        content += '<tr><td>Status:</td><td>' + $order.find('status').text() + '</td></tr>';
                        content += '<tr><td>Order date:</td><td>' + $order.find('sender date').text() + '</td></tr>';
                        content += '<tr><td>Address:</td><td>' + $order.find('receiver town').text() + ' ' + $order.find('receiver address').text() + '</td></tr>';
                        content += '<tr><td>Delivery datetime:</td><td>' + $order.find('delivereddate').text() + ' ' + $order.find('deliveredtime').text() + '</td></tr>';
                        content += '<tr><td>Comments:</td><td>' + $order.find('instruction').text() + '</td></tr>';

                        content += '</table>';

                        $orderCard.find('.content').html(content);
                        _this.showPage('orderCard');


                    }

                    order = {orderno: $order.attr('orderno'), lat: $order.find('currcoords').attr('lat') || 55.75393, lon: $order.find('currcoords').attr('lon') || 37.620795, accuracy: $order.find('currcoords').attr('accuracy') || 6, onTouch: orderTouch}

                    _this.orders.push(order);

                    $orderItem.on('touchend', orderTouch);

                    $searchResults.append($orderItem);


                })


            })

        },

        bindButtonsEvents: function () {
            var buttons = document.querySelectorAll('.button'),
                _this = this;

            for (i = 0; i < buttons.length; i++) {
                button = buttons[i];

                button.ontouchend = button.onclick = function () {
                    var pageId = this.dataset.action;
                    _this.showPage(pageId);
                }
            }

            _this.popup.find('.close').on('touchend', function () {
                //_this.popup.addClass('hidden');
                _this.hide(_this.popup);
            })

            $(document).on('click touchend', '.form .radios div', function () {
                var $item = $(this);

                $item.addClass('checked').siblings('div').removeClass('checked');
                $item.siblings('#orderType').val($item.data('value'));
            })

            $(document).on('touchend', '.page .menu .list', function () {
                _this.showPage('trackingResultsList');
            });
            $(document).on('touchend', '.page .menu .map', function () {
                _this.showPage('trackingResultsMap');
            });
            $(document).on('touchend', '.page .menu .refresh', function () {

                console.log('refresh');
                _this.loadOrders();
            });

        },
        bindMenuEvents: function () {
            var footer = document.getElementById('footer');
            var footerMenuItems = footer.querySelectorAll('.mainMenu li');
            var pageId = '', menuItem = null, _this = this;


            for (i = 0; i < footerMenuItems.length; i++) {
                menuItem = footerMenuItems[i];

                menuItem.ontouchend = menuItem.onclick = function () {
                    var pageId = this.dataset.action;

                    if (_this.login && _this.password) {
                        _this.showPage(pageId);
                    }
                    else {
                        _this.showPage('login');
                    }


                }
            }

        },
        bindLoginEvents: function () {
            var $form = $('#login .loginForm'),
                _this = this;

            $(document).on('submit', '#login .loginForm', function () {
                var login = $form.find('#loginInput').val(),
                    password = $form.find('#passwordInput').val();

                _this.authorize(login, password);

                return false;
            })

        },

        showPage: function (pageId) {
            console.log(pageId);

            var event = new CustomEvent('show-' + pageId);

            var $currentMenuItem = $('#footer .mainMenu li[data-action="' + pageId + '"]'),
                $currentPage = $('.page#' + pageId);

            document.addEventListener('show-' + pageId, this.onShowPage(pageId), false);

            $currentPage.addClass('current').siblings('.page').removeClass('current');

            $currentMenuItem.addClass('active').siblings('li').removeClass('active');

            document.dispatchEvent(event);

        },

        authorize: function (login, password) {
            if (!login || !password) {
                return false;
            }

            var _this = this;

            if (!navigator.onLine) {
                _this.showPopup('No internet connection');

                return false;
            }

            var data = '<itemlist>' +
                '<auth extra="' + _this.extra + '" login="' + login + '" pass="' + password + '" />' +
                '</itemlist>';

            _this.apiSend(data, function (data) {
                var $error = $(data).find('error');
                var $profileIcon = $('#header .profile');


                if ($error.length > 0) {
                    _this.showPopup($error.attr('errormsg'));
                }
                else {
                    localStorage.setItem('login', login);
                    localStorage.setItem('password', password);

                    _this.login = localStorage.getItem('login');
                    _this.password = localStorage.getItem('password');

                    $profileIcon.show();

                    _this.showPage('trackingResultsList');
                }

            });


            return true;
        },

        apiSend: function (data, callback) {
            var _this = this;

            //_this.show(_this.spinner);

            _this.spinner.show();

            $.ajax({
                url: _this.apiURL,
                data: data,
                type: 'POST',
                //contentType: "text/xml",
                //dataType: "text/xml",
                complete: function () {
                    //_this.hide(_this.spinner);
                    _this.spinner.hide();
                },
                success: function (data) {
                    callback(data);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log(xhr.status);
                    console.log(thrownError);

                    _this.showPopup(thrownError);
                }
            });

        },

        getNewsContent: function () {
            var $container = $('#news .content'),
                _this = this;

            if ($container.html() != '') {
                return false;
            }

            if (!navigator.onLine) {
                _this.showPopup('No internet connection');

                return false;
            }

            //_this.show(_this.spinner);
            _this.spinner.show();

            $.getJSON('http://biocard.com/api/news',function (data) {
                //_this.spinner.addClass('hidden');
                //_this.hide(_this.spinner);
                _this.spinner.hide();

                for (i = 0; i < data.data.length; i++) {
                    item = data.data[i];

                    $container.append('<div class="item"><span class="date">' + _this.dateFormat(item.created_time) + '</span><h4>' + item.message + '</h4>' + (item.type == 'photo' ? '<img src="' + item.picture + '" />' : '') +'</div>');
                }

            }).fail(function () {
                console.log("error");
                _this.showPopup('Error receiving data');
            });

            $(document).on('click touchend', '#news a', function (e) {
                e.preventDefault();

                return false;
            })

        },

        show: function (obj) {
            obj.css({'display': 'block'});
            obj.removeClass('hidden');
        },

        hide: function (obj) {
            obj.addClass('hidden');

            setTimeout(function () {
                obj.css({'display': 'none'});
            }, 250)
        },

        showPopup: function (text) {
            this.popup.find('.content').html(text);
            this.show(this.popup);

        },

        dateFormat: function (date) {
            var date = new Date(date);

            return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay() + '&nbsp;' + date.getHours() + ':' + date.getMinutes();
        }


    }
    ;

$(document).ready(function () {
    app.init();
})


function nextChar(c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}
