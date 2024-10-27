import {faker} from "@faker-js/faker";
import { User } from "../models/user.js";

const createUser=async(numUsers)=>{
    try{
        const userPromise=[];
        for(let i=0;i<numUsers;i++){
            const tempUser=User.create({
                name:faker.person.fullName(),
                username:faker.internet.userName(),
                bio:faker.lorem.sentence(10),
                password:"password",
                avatar:{
                    url:faker.image.avatar(),
                    public_id:faker.system.fileName(),
                }
            });
            userPromise.push(tempUser);


        }
        await Promise.all(userPromise);
        console.log("Users Created",numUsers);
        process.exit();
    }
    catch(err){
        console.log(err);
    }
    
};

export {createUser}