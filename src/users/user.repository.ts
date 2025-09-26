import { Inject, Injectable } from "@nestjs/common";
import { GenericRepository } from "src/common/repositories/generic.repository";
import { User, UserDocument } from "./entities/user.entity";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class UserRepository extends GenericRepository<UserDocument>{
    constructor(@InjectModel(User.name) readonly userModel:Model<UserDocument>){
        super(userModel)
    }
}