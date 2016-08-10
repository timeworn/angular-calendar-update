import {
  inject,
  async,
  TestComponentBuilder,
  ComponentFixture,
  addProviders
} from '@angular/core/testing';
import * as moment from 'moment';
import {expect} from 'chai';
import {spy} from 'sinon';
import {
  CalendarMonthView,
  CalendarEventTitle,
  CalendarEvent,
  CalendarMomentDateFormatter,
  CalendarDateFormatter
} from './../angular2-calendar';
import {Subject} from 'rxjs/Subject';
import {triggerDomEvent} from './util';

describe('calendarMonthView component', () => {

  beforeEach(() => {
    addProviders([CalendarEventTitle, {provide: CalendarDateFormatter, useClass: CalendarMomentDateFormatter}]);
  });

  let builder: TestComponentBuilder, eventTitle: CalendarEventTitle;
  beforeEach(inject([TestComponentBuilder, CalendarEventTitle], (tcb, _eventTitle_) => {
    builder = tcb;
    eventTitle = _eventTitle_;
  }));

  it('should generate the month view', async(() => {
    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.ngOnChanges({date: {}});
      expect(fixture.componentInstance.view.rowOffsets).to.deep.equal([0, 7, 14, 21, 28]);
      expect(fixture.componentInstance.view.days.length).to.equal(35);
      expect(fixture.componentInstance.view.days[0].date.toDate()).to.deep.equal(moment('2016-05-29').toDate());
      fixture.destroy();
    });
  }));

  it('should open and close the slide box', async(() => {
    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      expect(fixture.componentInstance.openRowIndex).to.be.undefined;
      expect(fixture.componentInstance.openDay).to.be.undefined;
      fixture.componentInstance.date = moment().startOf('month').startOf('week').add(8, 'days').toDate();
      fixture.componentInstance.slideBoxIsOpen = true;
      fixture.componentInstance.ngOnChanges({date: {}, slideBoxIsOpen: {}});
      expect(fixture.componentInstance.openRowIndex).to.equal(7);
      expect(fixture.componentInstance.openDay).to.equal(fixture.componentInstance.view.days[8]);
      fixture.componentInstance.slideBoxIsOpen = false;
      fixture.componentInstance.ngOnChanges({date: {}, slideBoxIsOpen: {}});
      expect(fixture.componentInstance.openRowIndex).not.to.be.ok;
      expect(fixture.componentInstance.openDay).not.to.be.ok;
      fixture.destroy();
    });
  }));

  it('should add a custom CSS class to events', async(() => {
    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.events = [{
        start: new Date('2016-05-30'),
        end: new Date('2016-06-02'),
        cssClass: 'foo',
        title: 'foo',
        color: {
          primary: 'blue'
        }
      }];
      fixture.componentInstance.ngOnChanges({date: {}, events: {}});
      fixture.detectChanges();
      const event: HTMLElement = fixture.nativeElement.querySelector(
        '.cal-days .cal-cell-row .cal-cell:nth-child(4) .cal-events .cal-event'
      );
      expect(event.classList.contains('foo')).to.be.true;
      fixture.destroy();
    });
  }));

  it('should add a custom CSS class to days via the cell modifier', async(() => {
    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.cellModifier = day => {
        day.cssClass = 'foo';
        return day;
      };
      fixture.componentInstance.ngOnChanges({date: {}, events: {}});
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cal-days .cal-cell').classList.contains('foo')).to.be.true;
      fixture.destroy();
    });
  }));

  it('should add the highlight class to events on mouse over', async(() => {
    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.events = [{
        start: new Date('2016-05-30'),
        end: new Date('2016-06-02'),
        title: 'foo',
        color: {
          primary: 'blue',
          secondary: 'rgb(238, 238, 238)'
        }
      }];
      fixture.componentInstance.ngOnChanges({date: {}, events: {}});
      fixture.detectChanges();
      const event: HTMLElement = fixture.nativeElement.querySelector(
        '.cal-days .cal-cell-row .cal-cell:nth-child(4) .cal-events .cal-event'
      );
      const day: HTMLElement = fixture.nativeElement.querySelector('.cal-days .cal-cell-row .cal-cell:nth-child(4)');
      triggerDomEvent('mouseenter', event);
      fixture.detectChanges();
      expect(day.style.backgroundColor).to.equal('rgb(238, 238, 238)');
      triggerDomEvent('mouseleave', event);
      fixture.detectChanges();
      expect(day.style.backgroundColor).to.be.equal('');
    });
  }));

  it('should add event actions to the slidebox', async(() => {

    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.events = [{
        start: new Date('2016-06-26'),
        end: new Date('2016-06-28'),
        title: 'foo',
        color: {
          primary: 'blue',
          secondary: 'rgb(238, 238, 238)'
        },
        actions: [{
          label: '<i class="fa fa-fw fa-times"></i>',
          onClick: spy(),
          cssClass: 'foo'
        }]
      }];
      fixture.componentInstance.slideBoxIsOpen = true;
      fixture.componentInstance.ngOnChanges({date: {}, events: {}});
      fixture.detectChanges();
      const action: HTMLElement = fixture.nativeElement.querySelector('.cal-slidebox .cal-event-action');
      expect(action.innerHTML).to.equal('<i class="fa fa-fw fa-times"></i>');
      expect(action.classList.contains('foo')).to.be.true;
      action.click();
      expect(fixture.componentInstance.events[0].actions[0].onClick).to.have.been.calledWith({event: fixture.componentInstance.events[0]});
    });

  }));

  it('should call the event clicked callback', async(() => {

    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.events = [{
        start: new Date('2016-06-26'),
        end: new Date('2016-06-28'),
        title: '<span>foo</span>',
        color: {
          primary: 'blue',
          secondary: 'rgb(238, 238, 238)'
        }
      }];
      fixture.componentInstance.slideBoxIsOpen = true;
      fixture.componentInstance.ngOnChanges({date: {}, events: {}});
      fixture.detectChanges();
      const title: HTMLElement = fixture.nativeElement.querySelector('.cal-slidebox .cal-event-title');
      expect(title.innerHTML).to.equal('<span>foo</span>');
      fixture.componentInstance.eventClicked.subscribe(val => {
        expect(val).to.deep.equal({event: fixture.componentInstance.events[0]});
      });
      title.click();
    });

  }));

  it('should refresh the view when the refresh observable is emitted on', async(() => {
    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      fixture.componentInstance.refresh = new Subject();
      fixture.componentInstance.ngOnInit();
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.ngOnChanges({date: {}});
      const event: CalendarEvent = {
        start: new Date('2016-06-01'),
        end: new Date('2016-06-02'),
        title: 'foo',
        color: {
          primary: 'blue',
          secondary: 'lightblue'
        }
      };
      fixture.componentInstance.events.push(event);
      fixture.componentInstance.refresh.next(true);
      expect(fixture.componentInstance.view.days[3].events).to.deep.equal([event]);
      fixture.destroy();
    });
  }));

  it('should allow the event title to be customised by the calendarConfig provider', async(() => {
    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      eventTitle.month = (event: CalendarEvent) => {
        return `foo ${event.title}`;
      };
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.events = [{
        start: new Date('2016-06-26'),
        end: new Date('2016-06-28'),
        title: 'bar',
        color: {
          primary: 'blue',
          secondary: 'rgb(238, 238, 238)'
        }
      }];
      fixture.componentInstance.slideBoxIsOpen = true;
      fixture.componentInstance.ngOnChanges({date: {}, events: {}});
      fixture.detectChanges();
      const title: HTMLElement = fixture.nativeElement.querySelector('.cal-slidebox .cal-event-title');
      expect(title.innerHTML).to.equal('foo bar');
    });
  }));

  it('should allow the locale to be changed', async(() => {

    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      fixture.componentInstance.locale = 'de';
      fixture.componentInstance.date = new Date();
      fixture.componentInstance.ngOnChanges({date: {}, events: {}});
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cal-header .cal-cell').innerHTML.trim()).to.equal('Sonntag');
    });

  }));

  it('should allow the badge total to be customised', async(() => {
    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.cellModifier = day => {
        day.badgeTotal = 100;
        return day;
      };
      fixture.componentInstance.ngOnChanges({date: {}, events: {}});
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cal-day-badge').innerHTML).to.equal('100');
      fixture.destroy();
    });
  }));

  it('should show a tooltip on mouseover of the event', async(() => {

    builder.createAsync(CalendarMonthView).then((fixture: ComponentFixture<CalendarMonthView>) => {
      eventTitle.monthTooltip = (event: CalendarEvent) => {
        return `title: ${event.title}`;
      };
      fixture.componentInstance.date = moment('2016-06-27').toDate();
      fixture.componentInstance.events = [{
        start: new Date('2016-05-30'),
        end: new Date('2016-06-02'),
        title: 'foo <b>bar</b>',
        color: {
          primary: 'blue',
          secondary: 'rgb(238, 238, 238)'
        }
      }];
      fixture.componentInstance.ngOnChanges({date: {}, events: {}});
      fixture.detectChanges();
      const event: HTMLElement = fixture.nativeElement.querySelector(
        '.cal-days .cal-cell-row .cal-cell:nth-child(4) .cal-events .cal-event'
      );
      triggerDomEvent('mouseenter', event);
      fixture.detectChanges();
      const tooltip: Element = document.body.querySelector('.cal-tooltip');
      expect(tooltip.querySelector('.cal-tooltip-inner').innerHTML).to.equal('title: foo <b>bar</b>');
      expect(tooltip.classList.contains('cal-tooltip-top')).to.be.true;
      triggerDomEvent('mouseleave', event);
      fixture.detectChanges();
      expect(document.body.querySelector('.cal-tooltip')).not.to.be.ok;
    });

  }));

});
