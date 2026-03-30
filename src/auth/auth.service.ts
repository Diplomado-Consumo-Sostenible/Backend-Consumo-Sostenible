import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'node_modules/bcryptjs';
import { Genero } from 'src/users/genero/entity/genero.entity';
import { Perfil } from 'src/users/perfil/entity/perfil.entity';
import { Rol } from 'src/users/rol/entity/rol.entity';
import { CreateUsuarioDto } from 'src/users/user/dto/create-usuario.dto';
import { User } from 'src/users/user/entity/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usuarioRepository: Repository<User>,
        @InjectRepository(Rol)
        private rolRepository: Repository<Rol>,
        @InjectRepository(Genero)
        private generoRepository: Repository<Genero>,
        @InjectRepository(Perfil)
        private perfilRepository: Repository<Perfil>,
    ) {}


    async registerUser(userData: CreateUsuarioDto) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const rol = await this.rolRepository.findOne({
      where: { id: userData.rolId },
    });
    if (!rol) throw new BadRequestException('El Rol especificado no existe.');

    const existingUser = await this.usuarioRepository.findOne({
      where: { email: userData.email },
    });
    if (existingUser)
      throw new BadRequestException(
        'Ya existe un usuario con este correo electrónico.',
      );

    const newUser = this.usuarioRepository.create({
      email: userData.email,
      password: hashedPassword,
      rol,
    });

    const savedUser = await this.usuarioRepository.save(newUser);

    const genero = await this.generoRepository.findOne({
      where: { id_genero: userData.id_genero },
    });
    if (!genero)
      throw new BadRequestException('El género especificado no existe.');

    const newProfile = this.perfilRepository.create({
      genero: genero,
        nombre: userData.nombre,
        foto_perfil: userData.foto_perfil,
        telefono: userData.telefono,
    });
    newProfile.user = savedUser;

    await this.perfilRepository.save(newProfile);

    return {
      message: 'Usuario registrado correctamente con perfil asociado.',
      usuario: {
        id: savedUser.id_usuario,
        email: savedUser.email,
        rol: savedUser.rol.nombre,
      },
      perfil: {
        id_perfil: newProfile.id_perfil,
      },
    };
  }
}
