import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {AuthService} from '../../services/auth';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  username: string = '';

  constructor(private authService: AuthService) {
    this.username = authService.getUsername() || 'Admin';
  }
 logout(): void {
  this.authService.logout();
}
}
