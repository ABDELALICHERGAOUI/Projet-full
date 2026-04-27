import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { RouterOutlet } from '@angular/router';



@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  styleUrl: './layout.css',
  template: `
    <div class="shell">
      <app-navbar></app-navbar>
      <main class="page-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
    }
    .page-content {
      margin-left: 220px;   /* même largeur que .sidebar */
      flex: 1;
      background: #f4f6fb;
      min-height: 100vh;
    }
  `]
})
export class Layout {}
