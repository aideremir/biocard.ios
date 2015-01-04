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
    // Application Constructor
    init: function () {

        this.spinner = $('#content .spinnerContainer');
        this.popup = $('#popup-container');
        this.extra = 13;

        this.hide(this.popup);

        this.bindMenuEvents();
        this.bindButtonsEvents();
        this.bindLoginEvents();

        var $profileIcon = $('#header .profile');


        if(!localStorage.getItem('login') || !localStorage.getItem('password'))
        {
            this.showPage('login');

            $profileIcon.hide();
        }
        else {
            this.login = localStorage.getItem('login');
            this.password = localStorage.getItem('password');

            $profileIcon.show();
        }


    },

    onShowPage: function (pageId) {
        var _this = this;
        _this.currentPage = pageId;

        switch (pageId) {
            case 'news':
                _this.getNewsContent();
                break;

            case 'profile':

                $('#' + pageId).find('.loginLabel').html(_this.login);

                $(document).on('touchend', '#logout', function(e)
                {

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
            case 'tracking':

                $(document).on('click touchend', '.form .radios div', function()
                {
                    var $item = $(this);

                    $item.addClass('checked').siblings('div').removeClass('checked');
                    $item.siblings('#orderType').val($item.data('value'));
                })

                break;

            case 'order':
                break;

        }

    },


    bindButtonsEvents: function () {
        var buttons = document.querySelectorAll('.button'),
            _self = this;

        for (i = 0; i < buttons.length; i++) {
            button = buttons[i];

            button.ontouchend = button.onclick = function () {
                var pageId = this.dataset.action;
                _self.showPage(pageId);
            }
        }

        _self.popup.find('.close').on('touchend', function() {
            //_self.popup.addClass('hidden');
            _self.hide(_self.popup);
        })


    },
    bindMenuEvents: function () {
        var footer = document.getElementById('footer');
        var footerMenuItems = footer.querySelectorAll('.mainMenu li');
        var pageId = '', menuItem = null, _self = this;


        for (i = 0; i < footerMenuItems.length; i++) {
            menuItem = footerMenuItems[i];

            menuItem.ontouchend = menuItem.onclick = function () {
                var pageId = this.dataset.action;

                if(_self.login && _self.password)
                {
                    _self.showPage(pageId);
                }
                else {
                    _self.showPage('login');
                }


            }
        }

    },
    bindLoginEvents: function() {
       var $form = $('#login .loginForm'),
           _self = this;

        $(document).on('submit', '#login .loginForm', function()
        {
            var login = $form.find('#loginInput').val(),
                password = $form.find('#passwordInput').val();

            _self.authorize(login, password);

            return false;
        })

    },

    showPage: function (pageId) {
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

        if(!navigator.onLine)
        {
            _this.showPopup('No internet connection');

            return false;
        }

        var data = '<itemlist><auth extra="' + _this.extra +'" login="' + login + '" pass="' + password + '" /></itemlist>';

        _this.apiSend(data, function(data)
        {
            var $error = $(data).find('error');
            var $profileIcon = $('#header .profile');


            if($error.length > 0)
            {
                _this.showPopup($error.attr('errormsg'));
            }
            else
            {
                localStorage.setItem('login', login);
                localStorage.setItem('password', password);

                _this.login = localStorage.getItem('login');
                _this.password = localStorage.getItem('password');

                $profileIcon.show();

                _this.showPage('tracking');
            }

        });




        return true;
    },
    
    apiSend : function(data, callback)
    {
        var _this = this;

        //_this.show(_this.spinner);

        _this.spinner.show();

        $.ajax({
            url: _this.apiURL,
            data: data,
            type: 'POST',
            //contentType: "text/xml",
            //dataType: "text/xml",
            complete: function() {
                //_this.hide(_this.spinner);
                _this.spinner.hide();
            },
            success : function(data)
            {
                callback(data);
            },
            error : function (xhr, ajaxOptions, thrownError){
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

        if(!navigator.onLine)
        {
            _this.showPopup('No internet connection');

            return false;
        }

        //_this.show(_this.spinner);
        _this.spinner.show();

        $.getJSON('http://biocard.com/api/news',function (data) {
            //_this.spinner.addClass('hidden');
            //_this.hide(_this.spinner);
            _this.spinner.hide();

            for (i = 0; i < data.entries.length; i++) {
                item = data.entries[i];

                $container.append('<div class="item"><span class="date">' + _this.dateFormat(item.published) + '</span><h4>' + item.title + '</h4>' + item.content + '</div>');
            }

        }).fail(function () {
            console.log("error");
            _this.showPopup('Error receiving data');
        });

        $(document).on('click touchend', '#news a', function(e) {
            e.preventDefault();

            return false;
        })

    },

    show: function(obj)
    {
        obj.css({'display': 'block'});
        obj.removeClass('hidden');
    },

    hide: function(obj)
    {
        obj.addClass('hidden');

        setTimeout(function(){
            obj.css({'display': 'none'});
        }, 250)
    },

    showPopup: function(text)
    {
        this.popup.find('.content').html(text);
        this.show(this.popup);

    },

    dateFormat: function (date) {
        var date = new Date(date);

        return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay() + '&nbsp;' + date.getHours() + ':' + date.getMinutes();
    }


};

$(document).ready(function () {
    app.init();
})
