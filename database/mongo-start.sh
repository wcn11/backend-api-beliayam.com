mongo

use admin

db.createUser(
  {
    user: "wahyu",
    pwd: "{Wahyu1109}",
    roles: [ 
    	{ role: "userAdminAnyDatabase", db: "beliayamcom_main" } 
    ]
  }
)

db.createUser(
  {
    user: "bac.beliayamcom",
    pwd: "{bac.beliayamcom_main}",  
    roles: [
       { role: "userAdminAnyDatabase", db: "admin" }
    ]
  }
)

use beliayamcom_main

db.createUser(
  {
    user: "bac.beliayamcom",
    pwd: "{bac.beliayamcom_main}",  
    roles: [
       { role: "readWrite", db: "beliayamcom_main" }
    ]
  }
)
