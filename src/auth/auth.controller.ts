import { Body, Controller, Post, Res, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';
import { User } from './user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('/signup')
  signUp(@Res() res: Response, @Body() authCredentialsDto: AuthCredentialsDto) {
    this.authService.signUp(authCredentialsDto);
    return res.json({ ok: true, msg: 'cuenta creada correctamente' });
  }

  @Post('/signin')
  signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }

  @UseGuards(AuthGuard())
  @Get('/checktoken')
  validateUser(@GetUser() user: User): Promise<{ accessToken: string }> {
    return this.authService.validateUser(user);
  }
}
