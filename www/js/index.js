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
    // Application Constructor
    init: function () {
        this.bindMenuEvents();


    },

    onShowPage: function(pageId)
    {
        console.log(pageId);

    },


    bindMenuEvents: function()
    {
        var footer = document.getElementById('footer');
        var footerMenuItems = footer.querySelectorAll('.mainMenu li');
        var pageId = '', menuItem = null, _self = this;


        for(i=0;i < footerMenuItems.length; i++)
        {
            menuItem = footerMenuItems[i];

            menuItem.ontouchstart = menuItem.onclick = function()
            {
                var pageId = this.dataset.action;
                var siblings = this.parentNode.childNodes;



                for(i=0;i < siblings.length; i++)
                {
                    if(siblings[i].nodeName == 'LI'){
                        siblings[i].classList.remove('active');
                    }
                }

                this.classList.add('active');

                _self.showPage(pageId);

            }
        }

    },

    showPage: function(pageId)
    {
        var allPages = document.querySelectorAll('.page');
        var event = new CustomEvent('show-' + pageId);

        document.addEventListener('show-' + pageId, this.onShowPage(pageId), false);

        for(i=0;i < allPages.length; i++)
        {
            allPages[i].classList.remove('current');
        }

        document.getElementById(pageId).classList.add('current');

        document.dispatchEvent(event);



    }
};

app.init();