
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {
	name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
	name: "Welcome to your todolist!"
});

const item2 = new Item ({
	name: "Hit the + button to add the new item"
});

const item3 = new Item ({
	name: "<-- Hit this button to delete the item"
});

const defaultItems = [ item1, item2, item3 ];
const listSchema = {
	name: String,
	items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/", function (req, res) {

    Item.find({}).then(foundItems => {
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems).then(function() {
				console.log("Successfully saved default items to DB");
			  })
			  .catch(function(err){
				console.log(err);
			  })
		  res.redirect("/");
		} else {
		  res.render("list", {listtitle: "Today", newListItems: foundItems});
		}
	  })
	.catch(err => {
		console.log(err);
});


		
});

app.get("/:customListName", function(req,res){
	const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then(function(foundList) {
        if (!foundList) {

         ////create a new list////
          const list = new List ({
              name: customListName,
              items: defaultItems
            })

            list.save();
            res.redirect("/" + customListName);
        } else {

        /////Show an existing list////       
        res.render("list", {listtitle: foundList.name, newListItems: foundList.items});
        }

      })
	  .catch(function(err){
        console.log(err);
	  })
    });

	


app.post("/", function(req, res){
	const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (itemName !== "") {

    if (listName === "Today") {
     item.save();
     res.redirect("/");

   }  else {
     ///// for custom list////
     List.findOne({name: listName}).then(function(foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
	  .catch(function(err) {
		console.log(err);
	  })
   }
  }
});



app.post("/delete", function(req,res){
	const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {

    Item.findByIdAndRemove(checkedItemId).then(function() {
        console.log("Successfully deleted item");
        res.redirect("/");
      })
	  .catch(function(err){
       console.log(err);
	  })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(foundList) {
        
         res.redirect("/" + listName);
    })
	.catch(function(err){
		console.log(err);
	}) 
  }
});

app.get("/about", function(req, res){
	res.render("about page");
});

app.listen(3000, function () {
	console.log("Server started on port 3000.");
});
