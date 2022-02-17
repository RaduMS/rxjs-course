import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {
  concat,
  fromEvent,
  interval,
  noop,
  observable,
  Observable,
  of,
  timer,
  merge,
  Subject,
  BehaviorSubject,
  AsyncSubject,
  ReplaySubject, throwError
} from 'rxjs';
import {catchError, delayWhen, filter, finalize, map, retryWhen, shareReplay, subscribeOn, take, tap, timeout} from 'rxjs/operators';
import {createHttpObservable} from '../common/util';
import {Course} from '../model/course';


@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  private beginnerCourses: Course[];
  private advancedCourses: Course[];
  public beginnerCourses$: Observable<Course[]>;
  public advancedCourses$: Observable<Course[]>;

  ngOnInit() {

    // this.exampleForStartingTheCourse();
    // this.firstReturn();
    // this.secondReturnOfData();
    // this.secondRODFiltered();
    // this.secondRODWithObservable();
    // this.concatObservable();
    // this.margeObservable();
    // this.unsubscribeToObservable();
    // this.abortRequestMethod();
    // this.secondRODWithObservableWithCatchError();
    // this.secondRODWithObservableWithRetryWhen();
    // this.subjectAsObservable();
    // this.behaviorSubjectAsObservable();
    // this.asyncSubjectAsObservable();
    this.replaySubjectAsObservable();

  }

  private exampleForStartingTheCourse() {
    const intervals$ = timer(3000, 1000);

    const sub = intervals$.subscribe(value => console.log('Stream1 ' + value));

    setTimeout(() => sub.unsubscribe(), 9000);

    const click$ = fromEvent(document, 'click');

    click$.subscribe(
      event => console.log(event),
      error => console.log(error),
      () => console.log('completed')
    );
  }

  private createHttpObservable(url: string) {
    return Observable.create(observar => {

      fetch(url).then((response) => {

        return response.json();

      }).then((body) => {

        observar.next(body);

        observar.complete();

      }).catch((err) => {

        observar.error(err);

      });

    });
  }

  private firstReturn() {
    const http$ = this.createHttpObservable('/api/courses');


    http$.subscribe((respons) => {

      console.log(respons);

    }, () => {
    }, () => console.log('completed'));
  }

  private secondReturnOfData() {
    const http$ = this.createHttpObservable('/api/courses');

    const courses$ = http$.pipe(
      map(res => Object.values(res['payload']))
    );

    courses$.subscribe((courses) => {

      console.log(courses);

    }, () => {
    }, () => console.log('completed'));
  }

  private secondRODFiltered() {
    const http$ = this.createHttpObservable('/api/courses');

    const courses$ = http$.pipe(
      map(res => Object.values(res['payload']))
    );

    courses$.subscribe((courses) => {

      this.beginnerCourses = courses.filter(courses => courses.category == 'BEGINNER');

      this.advancedCourses = courses.filter(courses => courses.category == 'ADVANCED');

      console.log(this.beginnerCourses);
      console.log(this.advancedCourses);

    }, () => {
    }, () => console.log('completed'));
  }

  private secondRODWithObservable() {
    const http$ = this.createHttpObservable('/api/courses');

    // shareReplay() previne ca sa nu se faca cate un request pentru fiecare Observable
    // atentie requestul apare de doua ori totusi pentru ca in app.components.ts e initializat    this.store.init();
    const courses$: Observable<Course[]> = http$.pipe(
      tap(() => {
        console.log('HTTP request is executed (tap function)');
      }),
      map(res => Object.values(res['payload'])),
      shareReplay()
    );

    this.beginnerCourses$ = courses$.pipe(
      map((courses: any) => courses.filter(course => course.category == 'BEGINNER'))
    );

    this.advancedCourses$ = courses$.pipe(
      map((courses: any) => courses.filter(course => course.category == 'ADVANCED'))
    );

    console.log(this.beginnerCourses$);
    console.log(this.advancedCourses$);
  }

  private concatObservable() {

    const source1$ = of(1, 2, 3);
    const source2$ = of(4, 5, 6);
    const source3$ = of(7, 8, 9);


    const result$ = concat(source1$, source2$, source3$);

    // result$.subscribe((val) => {
    //   console.log(val);
    // });

    result$.subscribe(console.log);
  }

  private margeObservable() {

    const interval1$ = interval(1000);
    const interval2$ = interval1$.pipe(map(value => value * 10));

    const result$ = merge(interval1$, interval2$);

    result$.subscribe(console.log);
  }

  private unsubscribeToObservable() {

    const interval1$ = interval(1000);

    const sub = interval1$.subscribe(console.log);

    setTimeout(() => {
      sub.unsubscribe();
    }, 5000);
  }

  private createHttpObservableWithAbortMethod(url: string) {
    return Observable.create(observar => {

      const controller = new AbortController();
      const signal = controller.signal;

      fetch(url, {signal})
        .then((response) => {

          return response.json();

        })
        .then((body) => {

          observar.next(body);

          observar.complete();

        })
        .catch((err) => {

          observar.error(err);

        });

      return () => controller.abort();

    });
  }

  private abortRequestMethod() {

    const http$ = this.createHttpObservableWithAbortMethod('/api/courses');

    const sub = http$.subscribe(console.log());

    setTimeout(() => sub.unsubscribe(), 0);
  }

  private createHttpObservableWithCatchError(url: string) {
    return Observable.create(observar => {

      fetch(url).then((response) => {

        if (response.ok) {
          return response.json();
        } else {
          observar.error(`Request failed with status code: ${response.status}`);
        }

      }).then((body) => {

        observar.next(body);

        observar.complete();

      }).catch((err) => {

        observar.error(err);

      });

    });
  }

  private secondRODWithObservableWithCatchError() {
    const http$ = this.createHttpObservableWithCatchError('/api/courses');

    // shareReplay() previne ca sa nu se faca cate un request pentru fiecare Observable
    // atentie requestul apare de doua ori totusi pentru ca in app.components.ts e initializat    this.store.init();
    // catchError este apelata prima ca si parametru pentru ca daca este dupa shareReplay se executa de cate doua ori
    // pentru ca avem courses$.pipe de doua ori
    // la fel si pentru finalize
    const courses$: Observable<Course[]> = http$.pipe(
      catchError(err => {
        console.log(err);

        return throwError(err);
      }),
      finalize(() => {
        console.log('Finalize executed...');
      }),
      tap(() => {
        console.log('HTTP request is executed (tap function)');
      }),
      map(res => Object.values(res['payload'])),
      shareReplay()
    );

    this.beginnerCourses$ = courses$.pipe(
      map((courses: any) => courses.filter(course => course.category == 'BEGINNER'))
    );

    this.advancedCourses$ = courses$.pipe(
      map((courses: any) => courses.filter(course => course.category == 'ADVANCED'))
    );

    console.log(this.beginnerCourses$);
    console.log(this.advancedCourses$);
  }

  private secondRODWithObservableWithRetryWhen() {
    const http$ = this.createHttpObservableWithCatchError('/api/courses');

    // shareReplay() previne ca sa nu se faca cate un request pentru fiecare Observable
    // atentie requestul apare de doua ori totusi pentru ca in app.components.ts e initializat    this.store.init();
    // catchError este apelata prima ca si parametru pentru ca daca este dupa shareReplay se executa de cate doua ori
    // pentru ca avem courses$.pipe de doua ori
    // la fel si pentru finalize
    const courses$: Observable<Course[]> = http$.pipe(
      tap(() => {
        console.log('HTTP request is executed (tap function)');
      }),
      map(res => Object.values(res['payload'])),
      shareReplay(),
      retryWhen(error => error.pipe(
        delayWhen(() => timer(2000))
      ))
    );

    this.beginnerCourses$ = courses$.pipe(
      map((courses: any) => courses.filter(course => course.category == 'BEGINNER'))
    );

    this.advancedCourses$ = courses$.pipe(
      map((courses: any) => courses.filter(course => course.category == 'ADVANCED'))
    );

    console.log(this.beginnerCourses$);
    console.log(this.advancedCourses$);
  }

  private subjectAsObservable() {

    const subject = new Subject();

    const series$ = subject.asObservable();

    series$.subscribe(value => console.log(`First subscription ${value}`));

    subject.next(1);
    subject.next(2);
    subject.next(3);
    // subject.complete();

    // al doilea subscribe nu este apelata pentru ca avem un Subject si nu un BehavioralSubject
    setTimeout(() => {
      series$.subscribe(value => console.log(`Second subscription ${value}`));

      subject.next(4);
    }, 3000);

  }

  private behaviorSubjectAsObservable() {

    const subject = new BehaviorSubject(0);

    const series$ = subject.asObservable();

    series$.subscribe(value => console.log(`First subscription ${value}`));

    subject.next(1);
    subject.next(2);
    subject.next(3);
    // subject.complete();

    // al doilea subscribe primeste ultima valoare a BehaviorSubject (3) si cea care e apelata pe urma
    setTimeout(() => {
      series$.subscribe(value => console.log(`Second subscription ${value}`));

      subject.next(4);
    }, 3000);

  }

  private asyncSubjectAsObservable() {

    const subject = new AsyncSubject();

    const series$ = subject.asObservable();

    series$.subscribe(value => console.log(`First subscription ${value}`));

    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.complete();

    // al doilea subscribe primeste ultima valoare a AsyncSubject (3)
    // chiar daca este apelata functia de complete()
    setTimeout(() => {
      series$.subscribe(value => console.log(`Second subscription ${value}`));

      subject.next(4);
    }, 3000);

  }

  private replaySubjectAsObservable() {

    const subject = new ReplaySubject();

    const series$ = subject.asObservable();

    series$.subscribe(value => console.log(`First subscription ${value}`));

    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.complete();

    // al doilea subscribe primeste toate valorile de la ReplaySubject
    // chiar daca este apelata functia de complete()
    setTimeout(() => {
      series$.subscribe(value => console.log(`Second subscription ${value}`));

      subject.next(4);
    }, 3000);

  }

}






