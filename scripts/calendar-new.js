const DATA_SOURCES = [
            { organizer: 'DNA Trails', singles: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAyBf4cwkXSOi5zz36U-r9uuV8KroW60CEbkEXQ8vuoCL60kT3Zbg9hKwQFVUJfBl_Ttln1WW9roqS/pub?gid=1538217407&single=true&output=csv', recurring: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAyBf4cwkXSOi5zz36U-r9uuV8KroW60CEbkEXQ8vuoCL60kT3Zbg9hKwQFVUJfBl_Ttln1WW9roqS/pub?gid=1880778759&single=true&output=csv', cancelled: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSAyBf4cwkXSOi5zz36U-r9uuV8KroW60CEbkEXQ8vuoCL60kT3Zbg9hKwQFVUJfBl_Ttln1WW9roqS/pub?gid=2020183836&single=true&output=csv' },
        ];

        function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
        function addWeeks(d,n){ return addDays(d, n*7); }
        function addMonths(d,n){ const x=new Date(d); x.setMonth(x.getMonth()+n); return x; }
        function startOfMonth(d){ const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
        function endOfMonth(d){ const x=new Date(d); x.setMonth(x.getMonth()+1); x.setDate(0); x.setHours(23,59,59,999); return x; }
        function startOfWeek(d){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
        function fmtTime(d){ return d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit', hour12: false}); }
        function sameYMD(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
        function endOfDay(d){ const x=new Date(d); x.setHours(23,59,59,999); return x; }

        async function fetchCSV(url){ const res=await fetch(url); if(!res.ok) throw new Error('CSV load failed'); return await res.text(); }
        function parseCSV(text){
            // Sheets' CSV export preserves cell line breaks; its TSV export flattens them.
            // Keep accepting tab-separated input for existing callers and saved feeds.
            const delimiter = text.split(/\r?\n/, 1)[0].includes('\t') ? '\t' : ',';
            const rows=[]; let i=0, field='', row=[], inQuotes=false;
            function pushField(){ row.push(field); field=''; }
            function pushRow(){ rows.push(row); row=[]; }
            while(i<text.length){
                const ch=text[i];
                if(inQuotes){
                    if(ch==='"'){
                        if(text[i+1]==='"'){ field+='"'; i+=2; continue; }
                        inQuotes=false; i++; continue;
                    } else { field+=ch; i++; continue; }
                } else {
                    if(ch==='"'){ inQuotes=true; i++; continue; }
                    if(ch===delimiter){ pushField(); i++; continue; }
                    if(ch==='\n'){ pushField(); pushRow(); i++; continue; }
                    if(ch==='\r'){ i++; continue; }
                    field+=ch; i++;
                }
            }
            if(field!=='' || row.length){ pushField(); pushRow(); }
            if(rows.length===0) return {header:[], records:[]};
            const header=rows[0].map(h=>h.trim());
            const records=rows.slice(1).filter(r=>r.length && r.some(c=>c.trim()!==''));
            return {header, records};
        }
        function normHeader(n){
            const t=(n||'').trim().toLowerCase();
            if(['dag','datum','date'].includes(t)) return 'dag';
            if(['title','titel'].includes(t)) return 'title';
            if(['begintijd','start','starttijd','from', 'start_time'].includes(t)) return 'begintijd';
            if(['eindtijd','eind','endtijd','until','to', 'end_time'].includes(t)) return 'eindtijd';
            if(['sport','type','categorie','lesson','class'].includes(t)) return 'sport';
            if(['beschrijving','omschrijving','description','notes'].includes(t)) return 'beschrijving';
            if(['organizer','organisatie','provider','studio'].includes(t)) return 'organizer';
            if(['startplek','locatie','location','venue'].includes(t)) return 'startplek';
            if(['boeklink','bookingurl','link','url'].includes(t)) return 'boeklink';
            if(['herhaling','repeat','rrule','frequency'].includes(t)) return 'herhaling';
            if(['tot','einddatum','until','repeat_until','until_date'].includes(t)) return 'tot';
            if(['docent','teacher','instructor'].includes(t)) return 'docent';
            return t;
        }
        function rowToObj(header,row){ const obj={}; for(let i=0;i<header.length;i++){ obj[normHeader(header[i])] = (row[i]||'').trim(); } return obj; }
        function parseDateNL(s){ const t=(s||'').trim(); if(!t) return null; if(/^\d{4}-\d{2}-\d{2}$/.test(t)) return new Date(t); const m=t.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/); if(m){ const d=m[1], mo=m[2], y=m[3]; const Y=(y.length===2?('20'+y):y); return new Date(`${Y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`);} const d2=new Date(t); return isNaN(+d2)?null:d2; }
        function parseTimeHM(s){ const m=(s||'').trim().match(/^(\d{1,2}):(\d{2})$/); if(!m) return null; return {h:+m[1], m:+m[2]}; }
        function combineDateTime(d,hm){ const x=new Date(d); x.setHours(hm.h, hm.m, 0, 0); return x; }

        function findNthDayOfMonth(year, monthIndex, dayOfWeek, n) {
            let date = new Date(year, monthIndex, 1);
            let count = 0;
            while (date.getMonth() === monthIndex) {
                if (date.getDay() === dayOfWeek) {
                    count++;
                    if (count === n) return new Date(date);
                }
                date.setDate(date.getDate() + 1);
            }
            return null;
        }

        function toEvent(obj, fallbackOrganizer){
            const dag=parseDateNL(obj.dag); const st=parseTimeHM(obj.begintijd||''); const en=parseTimeHM(obj.eindtijd||'');
            const start=(dag&&st)?combineDateTime(dag,st):null; const end=(dag&&en)?combineDateTime(dag,en):null;
            return {
                title: obj.title||'Lesson', start, end,
                teacher: obj.docent||'', type: obj.sport||'Unknown',
                bookingUrl: obj.boeklink||'',
                startplek: obj.startplek||'', beschrijving: obj.beschrijving||'',
                organizer: obj.organizer||fallbackOrganizer||''
            };
        }

        async function loadSources(){
            const now=new Date();
            const rangeStart=addMonths(startOfMonth(now), -2);
            const rangeEnd=addMonths(endOfMonth(now), 6);
            const all=[];

            for(const src of DATA_SOURCES){
                if(src.singles){
                    try{
                        const txt=await fetchCSV(src.singles); 
                        const {header,records}=parseCSV(txt);
                        for(const r of records){ 
                            const o=rowToObj(header,r); 
                            const ev=toEvent(o, src.organizer); 
                            if(ev.start && ev.end && ev.end>=rangeStart && ev.start<=rangeEnd) all.push(ev); 
                        }
                    }catch(e){ console.warn('singles', e); }
                }

                const cancels=new Set();
                if(src.cancelled){
                    try{
                        const txt=await fetchCSV(src.cancelled); 
                        const {header,records}=parseCSV(txt);
                        for(const r of records){ 
                            const o=rowToObj(header,r); 
                            const d=parseDateNL(o.dag); 
                            if(!d) continue; 
                            const dateKey=d.toISOString().slice(0,10); 
                            const org=(o.organizer||src.organizer||'').trim(); 
                            const sport=(o.sport||'').trim(); 
                            const bt=(o.begintijd||'').trim(); 
                            cancels.add(`${dateKey}|${org}|${sport}|${bt}`); 
                            cancels.add(`${dateKey}|${org}|${sport}`);
                        } 
                    }catch(e){ console.warn('cancelled', e); }
                }

                if(src.recurring){
                    try{
                        const txt=await fetchCSV(src.recurring); 
                        const {header,records}=parseCSV(txt);
                        for(const r of records){
                            const o=rowToObj(header,r);
                            const anchor=parseDateNL(o.dag); 
                            const st=parseTimeHM(o.begintijd||''); 
                            const en=parseTimeHM(o.eindtijd||''); 
                            if(!st||!en) continue;
                            const freq=(o.herhaling||'weekly').toLowerCase(); 
                            const until=o.tot? endOfDay(parseDateNL(o.tot)) : rangeEnd;
                            let curStart,curEnd;
                            if(anchor){ 
                                curStart=combineDateTime(anchor,st); 
                                curEnd=combineDateTime(anchor,en); 
                            } else { 
                                continue; 
                            }
                            
                            if(curStart > rangeStart) {
                                if(freq === 'monthly') {
                                    const originalDayOfWeek = curStart.getDay();
                                    const originalPosition = Math.ceil(curStart.getDate() / 7);
                                    const durationMs = curEnd.getTime() - curStart.getTime();
                                    
                                    while(curStart > addWeeks(rangeStart, -8)) {
                                        const prevMonth = new Date(curStart.getFullYear(), curStart.getMonth() - 1, 1);
                                        const prevDate = findNthDayOfMonth(
                                            prevMonth.getFullYear(),
                                            prevMonth.getMonth(),
                                            originalDayOfWeek,
                                            originalPosition
                                        );
                                        if(!prevDate || prevDate < rangeStart) break;
                                        prevDate.setHours(curStart.getHours(), curStart.getMinutes(), curStart.getSeconds(), curStart.getMilliseconds());
                                        curStart = prevDate;
                                        curEnd = new Date(prevDate.getTime() + durationMs);
                                    }
                                } else {
                                    while(curStart>addWeeks(rangeStart,-8)){ 
                                        const prev=addWeeks(curStart,-1); 
                                        const prevEnd=addWeeks(curEnd,-1); 
                                        if(prev<rangeStart) break;
                                        curStart=prev; 
                                        curEnd=prevEnd; 
                                    }
                                }
                            }
                            
                            while(curStart<=until && curStart<=rangeEnd){
                                if(curEnd>=rangeStart){
                                    const dKey=curStart.toISOString().slice(0,10); 
                                    const org=(o.organizer||src.organizer||'').trim(); 
                                    const sport=(o.sport||'').trim(); 
                                    const bt=(o.begintijd||'').trim();
                                    const k1=`${dKey}|${org}|${sport}|${bt}`; 
                                    const k2=`${dKey}|${org}|${sport}`;

                                    if(!(cancels.has(k1)||cancels.has(k2))){ 
                                        const ev=toEvent({...o, dag:dKey}, src.organizer); 
                                        ev.start=new Date(curStart); 
                                        ev.end=new Date(curEnd); 
                                        all.push(ev); 
                                    }
                                }
                                
                                if(freq==='monthly'){ 
                                    const originalDayOfWeek = curStart.getDay();
                                    const originalPosition = Math.ceil(curStart.getDate() / 7);
                                    const durationMs = curEnd.getTime() - curStart.getTime(); 
                                    const nextMonth = new Date(curStart.getFullYear(), curStart.getMonth() + 1, 1);
                                    const newDate = findNthDayOfMonth(
                                        nextMonth.getFullYear(), 
                                        nextMonth.getMonth(), 
                                        originalDayOfWeek, 
                                        originalPosition
                                    );
                                    if(newDate) {
                                        newDate.setHours(curStart.getHours(), curStart.getMinutes(), curStart.getSeconds(), curStart.getMilliseconds());
                                        curStart = newDate;
                                        curEnd = new Date(newDate.getTime() + durationMs); 
                                    } else {
                                        const monthAfter = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1);
                                        const newDateAfter = findNthDayOfMonth(
                                            monthAfter.getFullYear(),
                                            monthAfter.getMonth(),
                                            originalDayOfWeek,
                                            originalPosition
                                        );
                                        if(newDateAfter) {
                                            newDateAfter.setHours(curStart.getHours(), curStart.getMinutes(), curStart.getSeconds(), curStart.getMilliseconds());
                                            curStart = newDateAfter;
                                            curEnd = new Date(newDateAfter.getTime() + durationMs);
                                        } else {
                                            break;
                                        }
                                    }
                                } else { 
                                    curStart=addWeeks(curStart,1); 
                                    curEnd=addWeeks(curEnd,1);
                                }
                            }
                        }
                    }catch(e){ console.warn('recurring', e); }
                }
            }
            return all;
        }

if (document.getElementById('calendarGrid')) {
        let monthOffset = 0;
        const MIN_MONTH_OFFSET = -2;
        let activeFilter = 'all';
        let EVENTS = [];

        /* Sport type → color mapping */
        const SPORT_COLORS = {
            'trail run': '#687344', 'trail race': '#9b6545', 'trail running': '#687344',
            'road running': '#7b8060', 'road': '#7b8060',
            'mtb': '#8c7047', 'mountain bike': '#8c7047', 'cycling': '#9a7c44',
            'hiking': '#657958', 'hike': '#657958', 'yoga': '#8b7777',
            'strength': '#9b6545', 'swim': '#647c70', 'swimming': '#647c70'
        };
        const FALLBACK_COLORS = ['#687344','#8c7047','#8b7777','#647c70','#9b6545','#7b8060'];
        const _sportColorCache = {};

        function getSportColor(type) {
            if (!type) return '#687344';
            const key = type.toLowerCase().trim();
            if (SPORT_COLORS[key]) return SPORT_COLORS[key];
            if (_sportColorCache[key]) return _sportColorCache[key];
            const idx = Math.abs([...key].reduce((a,c)=>a+c.charCodeAt(0),0)) % FALLBACK_COLORS.length;
            _sportColorCache[key] = FALLBACK_COLORS[idx];
            return _sportColorCache[key];
        }

        const modalEl = document.getElementById('eventModal');
        const closeBtn = document.querySelector('.close-btn');
        const monthTitle = document.getElementById('monthTitle');
        const calendarGrid = document.getElementById('calendarGrid');
        const mobileListView = document.getElementById('mobileListView');
        const filterSelect = document.getElementById('filterSelect');
        const prevBtn = document.getElementById('prevBtn');

        function updateMonthNav() {
            if (!prevBtn) return;
            const isAtMinMonth = monthOffset <= MIN_MONTH_OFFSET;
            prevBtn.disabled = isAtMinMonth;
            prevBtn.setAttribute('aria-disabled', String(isAtMinMonth));
            prevBtn.style.opacity = isAtMinMonth ? '0.45' : '1';
            prevBtn.style.cursor = isAtMinMonth ? 'not-allowed' : 'pointer';
        }

        function createGoogleCalendarLink(eventData) {
            const title = encodeURIComponent(eventData.title || '');
            const location = encodeURIComponent(eventData.startplek || '');
            const description = encodeURIComponent(EventDescription.toPlainText(eventData.beschrijving || ''));
            const startDate = new Date(eventData.start);
            const endDate = new Date(eventData.end);
            const formatISO = (d) => d.toISOString().replace(/[:-]/g, '').slice(0, 15) + 'Z';
            const dates = `${formatISO(startDate)}/${formatISO(endDate)}`;
            return `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${dates}&details=${description}&location=${location}`;
        }

        let modalReturnFocus;
        function closeEventModal() {
            modalEl.classList.remove('active');
            modalReturnFocus?.focus();
        }
        function showModal(eventData) {
            modalReturnFocus = document.activeElement;
            document.getElementById('modal-title').textContent = eventData.title;
            
            const modalTags = document.getElementById('modal-tags');
            modalTags.innerHTML = '';
            
            const organizerTag = document.createElement('span');
            organizerTag.className = 'tag';
            organizerTag.textContent = eventData.organizer || 'Unknown';
            modalTags.appendChild(organizerTag);
            
            const sportTag = document.createElement('span');
            sportTag.className = 'tag tag-sport';
            sportTag.textContent = eventData.type || 'Unknown';
            sportTag.style.background = getSportColor(eventData.type);
            modalTags.appendChild(sportTag);

            document.getElementById('modal-time').textContent = `${new Date(eventData.start).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} \u00b7 ${fmtTime(new Date(eventData.start))}–${fmtTime(new Date(eventData.end))}`;
            document.getElementById('modal-location').textContent = `${eventData.startplek ? '📍 ' + eventData.startplek : 'No location specified'}`;
            document.getElementById('modal-desc').innerHTML = EventDescription.render(eventData.beschrijving || 'No description available.');
            
            const bookLink = document.getElementById('modal-book-link');
            bookLink.href = eventData.bookingUrl;
            bookLink.style.display = eventData.bookingUrl ? 'inline-flex' : 'none';
            
            const calLink = document.getElementById('modal-cal-link');
            calLink.href = createGoogleCalendarLink(eventData);
            
            modalEl.classList.add('active');
            closeBtn.focus();
        }

        function renderMonth() {
            if (monthOffset < MIN_MONTH_OFFSET) monthOffset = MIN_MONTH_OFFSET;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentMonth = addMonths(startOfMonth(today), monthOffset);
            updateMonthNav();
            
            monthTitle.textContent = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            
            // Desktop calendar grid
            const firstDay = startOfMonth(currentMonth);
            const startDate = startOfWeek(firstDay);
            
            calendarGrid.innerHTML = '';
            
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            dayNames.forEach(name => {
                const header = document.createElement('div');
                header.className = 'day-header-cell';
                header.textContent = name;
                calendarGrid.appendChild(header);
            });
            
            let date = new Date(startDate);
            for (let i = 0; i < 42; i++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                
                const isCurrentMonth =
                    date.getMonth() === currentMonth.getMonth() &&
                    date.getFullYear() === currentMonth.getFullYear();
                const isToday = sameYMD(date, today);
                const isPast = date < today && !isToday;
                
                if (!isCurrentMonth) dayCell.classList.add('other-month');
                if (isPast) dayCell.classList.add('past');
                if (isToday) dayCell.classList.add('today');
                
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = date.getDate();
                dayCell.appendChild(dayNumber);
                
                const dayEvents = EVENTS.filter(e => sameYMD(new Date(e.start), date));
                
                if (dayEvents.length > 0) {
                    const eventsContainer = document.createElement('div');
                    eventsContainer.className = 'day-events';
                    
                    dayEvents.forEach(event => {
                        const pill = document.createElement('button');
                        pill.type = 'button';
                        pill.className = 'event-pill';
                        if (activeFilter !== 'all' && event.type !== activeFilter) {
                            pill.classList.add('filtered');
                        }
                        if (event.type) {
                            pill.dataset.sport = event.type;
                            const sportColor = getSportColor(event.type);
                            pill.style.borderLeftColor = sportColor;
                        }
                        
                        const pillTitle = document.createElement('div');
                        pillTitle.className = 'event-pill-title';
                        pillTitle.textContent = event.title;
                        pill.appendChild(pillTitle);
                        
                        const pillTime = document.createElement('div');
                        pillTime.className = 'event-pill-time';
                        pillTime.textContent = fmtTime(new Date(event.start));
                        pill.appendChild(pillTime);

                        if (event.type) {
                            const pillType = document.createElement('span');
                            pillType.className = 'event-pill-type';
                            pillType.textContent = event.type;
                            pillType.style.background = getSportColor(event.type);
                            pill.appendChild(pillType);
                        }
                        
                        pill.addEventListener('click', () => showModal(event));
                        eventsContainer.appendChild(pill);
                    });
                    
                    dayCell.appendChild(eventsContainer);
                }
                
                calendarGrid.appendChild(dayCell);
                date = addDays(date, 1);
            }

            // Mobile list view
            renderMobileList(currentMonth);
            const status = document.getElementById('calendar-status');
            if (status && EVENTS.length) {
                const matches = EVENTS.some(event => {
                    const start = new Date(event.start);
                    return start >= startOfMonth(currentMonth) && start <= endOfMonth(currentMonth) && (activeFilter === 'all' || event.type === activeFilter);
                });
                status.textContent = matches || matchMedia('(max-width: 768px)').matches ? '' : 'No matching events this month. Try another activity or month.';
            }
        }

        function renderMobileList(currentMonth) {
            mobileListView.innerHTML = '';
            
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);
            
            const monthEvents = EVENTS.filter(e => {
                const eventDate = new Date(e.start);
                return eventDate >= monthStart && eventDate <= monthEnd && (activeFilter === 'all' || e.type === activeFilter);
            }).sort((a, b) => new Date(a.start) - new Date(b.start));
            
            if (monthEvents.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'mobile-list-empty';
                empty.textContent = activeFilter === 'all' ? 'No events this month' : 'No matching events this month. Try another activity or month.';
                mobileListView.appendChild(empty);
                return;
            }
            
            const now = new Date();
            const upcomingEvents = monthEvents.filter(event => new Date(event.end) > now);
            const pastEvents = monthEvents.filter(event => new Date(event.end) <= now);

            if (upcomingEvents.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'mobile-list-empty';
                empty.textContent = 'No upcoming events this month.';
                mobileListView.appendChild(empty);
            }

            upcomingEvents.forEach(event => mobileListView.appendChild(createMobileEventCard(event)));

            if (pastEvents.length) {
                const history = document.createElement('details');
                history.className = 'past-events';
                const summary = document.createElement('summary');
                summary.textContent = `Past events (${pastEvents.length})`;
                history.appendChild(summary);
                const list = document.createElement('div');
                list.className = 'past-events-list';
                pastEvents.forEach(event => list.appendChild(createMobileEventCard(event)));
                history.appendChild(list);
                mobileListView.appendChild(history);
            }
        }

        function createMobileEventCard(event) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'event-list-item';
            if (event.type) {
                item.style.borderLeftColor = getSportColor(event.type);
            }

            const eventDate = new Date(event.start);
            const dateStr = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            const dateDiv = document.createElement('div');
            dateDiv.className = 'event-list-date';
            dateDiv.textContent = dateStr;
            item.appendChild(dateDiv);

            const titleDiv = document.createElement('div');
            titleDiv.className = 'event-list-title';
            titleDiv.textContent = event.title;
            item.appendChild(titleDiv);

            const timeDiv = document.createElement('div');
            timeDiv.className = 'event-list-time';
            timeDiv.textContent = `${fmtTime(new Date(event.start))} – ${fmtTime(new Date(event.end))}`;
            item.appendChild(timeDiv);

            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'event-list-tags';

            const orgTag = document.createElement('span');
            orgTag.className = 'tag';
            orgTag.textContent = event.organizer;
            tagsDiv.appendChild(orgTag);

            const typeTag = document.createElement('span');
            typeTag.className = 'tag tag-sport';
            typeTag.textContent = event.type;
            typeTag.style.background = getSportColor(event.type);
            tagsDiv.appendChild(typeTag);

            item.appendChild(tagsDiv);

            if (event.startplek) {
                const locationDiv = document.createElement('div');
                locationDiv.className = 'event-list-location';
                locationDiv.textContent = `📍 ${event.startplek}`;
                item.appendChild(locationDiv);
            }

            item.addEventListener('click', () => showModal(event));
            return item;
        }

        function rebuildFilters() {
            const sports = Array.from(new Set(EVENTS.map(e => e.type).filter(Boolean))).sort();
            const opts = ['<option value="all">All activities</option>'].concat(sports.map(t => `<option value="${t}">${t}</option>`));
            filterSelect.innerHTML = opts.join('');
        }

        closeBtn.addEventListener('click', closeEventModal);
        window.addEventListener('click', (e) => {
            if (e.target == modalEl) closeEventModal();
        });

        document.addEventListener('keydown', event => {
            if (!modalEl.classList.contains('active')) return;
            if (event.key === 'Escape') closeEventModal();
            if (event.key === 'Tab') {
                const items = [...modalEl.querySelectorAll('button, a[href]')].filter(el => el.getClientRects().length);
                const first = items[0], last = items[items.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });

        prevBtn.addEventListener('click', () => {
            if (monthOffset <= MIN_MONTH_OFFSET) return;
            monthOffset--;
            renderMonth();
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            monthOffset++;
            renderMonth();
        });
        
        document.getElementById('todayBtn').addEventListener('click', () => {
            monthOffset = 0;
            renderMonth();
        });

        filterSelect.addEventListener('change', () => {
            activeFilter = filterSelect.value;
            renderMonth();
        });

        // Handle window resize to re-render appropriately
        window.addEventListener('resize', () => {
            renderMonth();
        });




        // --- INIT (must come last) ---
const loadingOverlay = document.getElementById('loadingOverlay');
if (loadingOverlay) loadingOverlay.classList.remove('hidden');

(async function init() {
  try {
    let feedTimer;
    let loaded;
    try {
      loaded = await Promise.race([
        loadSources(),
        new Promise((_, reject) => { feedTimer = setTimeout(() => reject(new Error('Calendar feed timed out')), 15000); })
      ]);
    } finally { clearTimeout(feedTimer); }
    EVENTS = loaded.sort((a, b) => new Date(a.start) - new Date(b.start));
    rebuildFilters();
    renderMonth();
    const status = document.getElementById('calendar-status');
    if (status && !loaded.length) status.textContent = 'No events to show right now. Check WhatsApp for the latest plans.';
  } catch (err) {
    console.error('❌ Error loading events:', err);
    const status = document.getElementById('calendar-status');
    if (status) status.textContent = 'We could not load the calendar. Please reload, or check WhatsApp for updates.';
    rebuildFilters();
    renderMonth();
  } finally {
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => loadingOverlay.remove(), 400);
    }
  }
})();

} // Calendar UI; loadSources remains available to the homepage.
