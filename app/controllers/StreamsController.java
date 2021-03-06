/*
 * Copyright 2013 TORCH UG
 *
 * This file is part of Graylog2.
 *
 * Graylog2 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Graylog2 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Graylog2.  If not, see <http://www.gnu.org/licenses/>.
 */
package controllers;

import com.google.inject.Inject;
import lib.APIException;
import lib.ApiClient;
import lib.ServerNodes;
import models.Node;
import models.StreamService;
import models.api.requests.streams.CreateStreamRequest;
import models.api.results.StreamsResult;
import play.data.Form;
import play.mvc.Result;

import java.io.IOException;
import java.util.Map;

public class StreamsController extends AuthenticatedController {
    private static final Form<CreateStreamRequest> createStreamForm = Form.form(CreateStreamRequest.class);

    @Inject
    private StreamService streamService;

    @Inject
    private ServerNodes serverNodes;

    public Result index() {
		try {
			StreamsResult streams = streamService.allEnabled();
            Map<String, Node> nodes = serverNodes.asMap();

			return ok(views.html.streams.index.render(currentUser(), streams, nodes));
		} catch (IOException e) {
			return status(504, views.html.errors.error.render(ApiClient.ERROR_MSG_IO, e, request()));
		} catch (APIException e) {
			String message = "Could not fetch streams. We expected HTTP 200, but got a HTTP " + e.getHttpCode() + ".";
			return status(504, views.html.errors.error.render(message, e, request()));
		}
        catch (Exception e) {
            return internalServerError();
        }
	}

    public Result newStream() {
        return ok(views.html.streams.new_stream.render(currentUser()));
    }

    public Result create() {
        Form<CreateStreamRequest> form = createStreamForm.bindFromRequest();
        if (form.hasErrors()) {
            flash("error", "Please fill in all fields: " + form.errors());

            return redirect(routes.StreamsController.newStream());
        }

        try {
            CreateStreamRequest csr = form.get();
            csr.creatorUserId = currentUser().getName();
            streamService.create(csr);
        } catch (APIException e) {
            String message = "Could not create stream. We expected HTTP 201, but got a HTTP " + e.getHttpCode() + ".";
            return status(504, views.html.errors.error.render(message, e, request()));
        } catch (IOException e) {
            return status(504, views.html.errors.error.render(ApiClient.ERROR_MSG_IO, e, request()));
        }

        return redirect(routes.StreamsController.index());
    }

    public Result delete(String stream_id) {
        try {
            streamService.delete(stream_id);
        } catch (APIException e) {
            String message = "Could not delete stream. We expect HTTP 204, but got a HTTP " + e.getHttpCode() + ".";
            return status(504, views.html.errors.error.render(message, e, request()));
        } catch (IOException e) {
            return status(504, views.html.errors.error.render(ApiClient.ERROR_MSG_IO, e, request()));
        }

        return redirect(routes.StreamsController.index());
    }
	
}
