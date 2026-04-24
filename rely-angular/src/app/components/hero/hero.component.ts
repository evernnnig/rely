import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
})
export class HeroComponent {
  isPurchaseOpen = false;
}
