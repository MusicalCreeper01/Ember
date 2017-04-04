import reset // Include a CSS reset in the exported file
import material  // **WIP** - Include CSS and HTML post processing filters that follow Google Material Design standards

font("Roboto", "https://fonts.googleapis.com/css?family=Roboto:100,300,400,500")

// Creates a layout with a header, footer, sidebar, content area, etc
layout (basic) { //Header area
    title("User Login") // Creates an h1 element (or in the case of the material import, a x-title element)
} { // Body area
    h1("Test")
    form { // Creates a form element
        input("Username") // Creates an input elements with the label "Username"
        password("Password") // Creates an input[type=password] with the label "Password"
        email("Email") // Create an input[type=email] with the label "Email"
    }
} { // Footer Area
    title("Footer!")
}
